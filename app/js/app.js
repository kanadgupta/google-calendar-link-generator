;(function(){
    'use strict';

    var app = angular.module('calendar', ['ngAnimate']);

    app.controller('EventController', function($scope){
        $scope.allDay = false;
        $scope.start = {};
        $scope.end = {};
        var getUrl = function(title, desc, locat, start, end){
            var uri = new URI('https://www.google.com/calendar/render');
            // Google Calendar links requires both start and end dates,
            // so omit them if one of them is missing.
            // TODO: Add form validation for this?
            var dates = (!start) || (!end) ? undefined : start + '/' + end;
            uri.search({
                action:  'TEMPLATE',
                text:    title,
                details: desc,
                location: locat,
                dates
            });

            return uri.toString();
        };

        $scope.getUrl = function(){
            /* TODO Add form validation */
            $scope.copied = false;
            var start = $scope.allDay ? $scope.start.date : $scope.start.time;
            var end = $scope.allDay ? $scope.end.date : $scope.end.time;
            $scope.url = getUrl($scope.title, $scope.desc, $scope.locat, start, end);
        };
    });

    app.directive('datetime', function($parse){
        var link = function(scope, element, attrs){
            var options = {
                useCurrent: attrs.id === 'dateStartContainer', // https://github.com/Eonasdan/bootstrap-datetimepicker/issues/1075
                format: scope.allDay ? 'MM/DD/YYYY' : false
            };

            var dp    = $(element);
            var model = $parse(attrs.ngModel);

            dp.datetimepicker(options);
            dp.on('dp.change', function(e){
                // restricts boundaries so start time cannot be after end time
                // and end time cannot be before start time
                if (attrs.id === 'dateStartContainer') {
                    $('#dateEndContainer').data("DateTimePicker").minDate(e.date);
                } else {
                    $('#dateStartContainer').data("DateTimePicker").maxDate(e.date);
                }

                // Google Calendar misleadingly formats all-day event
                // links, so we need to increment the day by 1
                if (attrs.ngModel === 'end.date') e.date = e.date.add(1, 'd');

                var date = e.date
                    .utcOffset(0)
                    .format(scope.allDay ? 'YYYYMMDD' : 'YYYYMMDDTHHmmss');
                
                // Z is only required for full time formatting
                if (!scope.allDay) date += 'Z';

                scope.$apply(function(scope){
                    model.assign(scope, date);
                });
            });
        };

        return {
            restrict: 'A',
            link: link
        };
    });

    app.directive('copyOnClick', function(){
        var link = function(scope, element, attrs){
            var client = new ZeroClipboard(element);

            client.on('ready', function(event){
                client.on('copy', function(event) {
                    event.clipboardData.setData('text/plain', scope.url);

                    scope.$apply(function(scope){
                        scope.copied = true;
                    });
                });
            });
        };

        return {
            restrict: 'A',
            link: link
        };
    });
})();
