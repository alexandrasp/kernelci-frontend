/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define(function() {
    'use strict';
    var gDiffCommon;

    gDiffCommon = {};

    // Dimensions of the legend element.
    gDiffCommon.legend = {
        width: 17.5,
        height: 17.5,
        rx: 1
    };

    // Dimensions of the rectangle to represent the 'status'.
    gDiffCommon.status = {
        height: 35,
        rx: 2.5,
        ry: 2.5,
        width: 35
    };

    gDiffCommon.colors = {
        fail: '#d9534f',
        pass: '#5cb85c',
        unavail: '#7f7e7e',
        // TODO
        offline: '',
        unknown: '#f0ad4e'
    };

    gDiffCommon.icons = {
        fail: '\uf071',
        pass: '\uf00c',
        unknown: '?',
        // TODO
        offline: '',
        default: '\uf05e'
    };

    gDiffCommon.build_status = {
        fail: 'Build failed',
        pass: 'Build successful',
        unavail: 'Build not available',
        unknown: 'Build status unknown'
    };

    gDiffCommon.boot_status = {
        fail: 'Boot failed',
        pass: 'Boot successful',
        offline: 'Board offline',
        unavail: 'Boot not available',
        unknown: 'Boot status unknown'
    };

    gDiffCommon.symbols = {
        minus: '\u2212',
        plus: '\u002B',
        plus_minus: '\u00B1'
    };

    /**
     * Check if the passed argument is a function.
    **/
    gDiffCommon.isFunc = function(value) {
        return value && typeof(value) === 'function';
    };

    /**
     * Check if the passed value is valid.
     *
     * To be valid it has to:
     * . not be null or undefined
     * . not be an infinite or NaN value
     * . not be an empty string
     * . not be equal to the the string 'null', 'undefined' or 'none'
     *
     * @param {Number,String} value: The value to check.
     * @return {Boolean} The validity check result.
    **/
    gDiffCommon.isValidData = function(value) {
        var isValid;
        var toCheck;

        isValid = false;

        if (value !== null && value !== undefined) {

            if (typeof value === 'number') {
                if (isFinite(value) && !isNaN(value)) {
                    isValid = true;
                }
            } else {
                toCheck = String(value).toLowerCase();

                if (toCheck.length > 0) {
                    if (toCheck !== 'null' &&
                            toCheck !== 'undefined' && toCheck !== 'none') {
                        isValid = true;
                    }
                }
            }
        }

        return isValid;
    };

    /**
     * Check if the passed value is a number.
     *
     * @param {Number} value: The value to check.
     * @return {Boolean} The validity check result.
    **/
    gDiffCommon.isNumber = function(value) {
        if (value !== null &&
                value !== undefined && !isNaN(value) && isFinite(value)) {
            return true;
        }
        return false;
    };

    return gDiffCommon;
});
