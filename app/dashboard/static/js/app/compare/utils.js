/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery',
    'utils/html',
    'utils/format',
    'compare/diffcommon'
], function($, html, format, common) {
    'use strict';
    var gDiffUtils;

    gDiffUtils = {};

    function renderFormat(args) {
        var diff;
        var diffNumber;
        var height;
        var text;
        var tspan;
        var width;

        if (!args.format) {
            args.format = function(value) {
                return value;
            };
        }

        width = args.chart.square().width;
        height = args.chart.square().height;

        text = document.createElement('text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('transform', 'translate(0,4)');
        text.setAttribute('x', width / 2);
        text.setAttribute('y', height / 2);
        text.className = 'diff-text';

        tspan = document.createElement('tspan');
        tspan.setAttribute('x', width / 2);

        tspan.appendChild(document.createTextNode(args.format(args.value)));
        text.appendChild(tspan);

        if (args.valueIdx !== 0) {
            if (common.isNumber(args.baseNumber) &&
                    common.isNumber(args.value)) {
                diffNumber = args.value - args.baseNumber;

                // Reset the text container position and y-translation.
                text.setAttribute('y', height / 4);
                text.setAttribute('transform', 'translate(0,10)');

                tspan = document.createElement('tspan');
                tspan.setAttribute('x', width / 2);
                tspan.setAttribute('dy', '1.2em');

                if (diffNumber === 0) {
                    diff = '(' + common.symbols.plus_minus +
                        args.format(diffNumber) + ')';
                } else if (diffNumber > 0) {
                    diff = '(' + common.symbols.plus +
                        args.format(diffNumber) + ')';
                } else {
                    diff = '(' + common.symbols.minus +
                        args.format(Math.abs(diffNumber)) + ')';
                }

                tspan.innerHTML = diff;
                text.appendChild(tspan);
            }
        }

        return text;
    }

    function renderText(args) {
        var text;

        text = document.createElement('text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('transform', 'translate(0,4)');
        text.setAttribute('x', args.chart.square().width / 2);
        text.setAttribute('y', args.chart.square().height / 2);
        text.className = 'diff-text';

        text.appendChild(document.createTextNode(args.value));

        return text;
    }

    gDiffUtils.renderText = function(args) {
        return renderText(args);
    };

    gDiffUtils.renderTextLong = function(args) {
        var rendered;
        var old;

        if (args.value.length > 14) {
            old = args.value;
            args.value = html.sliceText(args.value, 14);

            rendered = renderText(args);

            $(args.parent.parentNode).tooltip({
                html: true,
                trigger: 'hover',
                container: 'body',
                placement: 'top',
                title: old
            });
        } else {
            rendered = renderText(args);
        }

        return rendered;
    };

    gDiffUtils.renderStatus = function(args) {
        var rect;
        var status;
        var tooltip;

        status = args.value.toLowerCase();

        rect = document.createElement('rect');
        rect.setAttribute(
            'x',
            (args.chart.square().width / 2) - (common.status.width / 2));
        rect.setAttribute(
            'y',
            (args.chart.square().height / 2) - (common.status.height / 2));
        rect.setAttribute('rx', 2.5);
        rect.setAttribute('ry', 2.5);
        rect.setAttribute('width', common.status.width);
        rect.setAttribute('height', common.status.height);

        if (common.colors.hasOwnProperty(status)) {
            rect.setAttribute('fill', common.colors[status]);
        } else {
            rect.setAttribute('fill', common.colors.unavail);
        }

        if (common.build_status.hasOwnProperty(status)) {
            tooltip = common.build_status[status];
        } else {
            tooltip = common.build_status.unavail;
        }

        $(args.parent).tooltip({
            html: true,
            trigger: 'hover',
            container: 'body',
            placement: 'top',
            title: tooltip
        });

        return rect;
    };

    gDiffUtils.renderFormat = function(args) {
        return renderFormat(args);
    };

    gDiffUtils.renderNumber = function(args) {
        args.value = parseInt(args.value, 10);

        if (args.baseline.hasOwnProperty(args.key)) {
            args.baseNumber = parseInt(args.baseline[args.key], 10);
        } else {
            args.baseNumber = 0;
        }

        args.format = format.number;

        return renderFormat(args);
    };

    gDiffUtils.renderBytes = function(args) {
        var title;
        args.value = parseInt(args.value, 10);

        if (args.baseline.hasOwnProperty(args.key)) {
            args.baseNumber = parseInt(args.baseline[args.key], 10);
        } else {
            args.baseNumber = Math.NaN;
        }

        args.format = format.bytes;
        if (args.valueIdx === 0) {
            title = format.bytesToBytes(args.baseNumber);
        } else {
            title = format.bytesToBytes(args.value);
        }

        $(args.parent).tooltip({
            html: true,
            trigger: 'hover',
            container: 'body',
            placement: 'top',
            title: title
        });

        return renderFormat(args);
    };

    gDiffUtils.renderBuildTime = function(args) {
        args.value = parseFloat(args.value);

        if (args.baseline.hasOwnProperty(args.key)) {
            args.baseNumber = parseFloat(args.baseline[args.key]);
        } else {
            args.baseNumber = Math.NaN;
        }

        args.format = format.number;

        return renderFormat(args);
    };

    gDiffUtils.renderBootTime = function(args) {
        function _toSeconds(value) {
            return ((value.getMinutes() * 60000) +
                (value.getSeconds() * 1000) + value.getMilliseconds()) / 1000;
        }

        args.value = _toSeconds(new Date(args.value.$date));

        if (args.baseline.hasOwnProperty(args.key)) {
            args.baseNumber = _toSeconds(
                new Date(args.baseline[args.key].$date));
        } else {
            args.baseNumber = Math.NaN;
        }

        args.format = format.number;

        return renderFormat(args);
    };

    gDiffUtils.renderCompiler = function(args) {
        var compiler;
        var rendered;

        compiler = args.datum.compiler_version_full;

        args.parent
            .parentNode.setAttribute('data-compiler', compiler);

        $(args.parent.parentNode).tooltip({
            html: true,
            trigger: 'hover',
            container: 'body',
            placement: 'top',
            title: compiler
        });

        rendered = renderText(args);

        return rendered;
    };

    return gDiffUtils;
});
