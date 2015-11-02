/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/base',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/tables',
    'utils/html',
    'utils/boot',
    'utils/const'
], function($, b, e, init, r, t, html, boot, appconst) {
    'use strict';
    var bootsTable,
        jobName,
        numberRange,
        pageLen,
        searchFilter;

    document.getElementById('li-boot').setAttribute('class', 'active');
    numberRange = appconst.MAX_NUMBER_RANGE;
    pageLen = null;
    searchFilter = null;

    function getDetailsCountFail() {
        html.replaceContentHTML(
            document.getElementById('boot-reports-count'), '&infin;');
        html.replaceContentHTML(
            document.getElementById('boot-boards-count'), '&infin;');
    }

    function getDetailsCountDone(response) {
        var boardsCount,
            reportsCount,
            results;

        results = response.result;
        reportsCount = 0;
        boardsCount = 0;

        if (results.length) {
            if (results[0].operation_id === 'boot-reports-count') {
                reportsCount = parseInt(results[0].result[0].count, 10);
                boardsCount = parseInt(results[1].result.length, 10);
            } else {
                reportsCount = parseInt(results[1].result[0].count, 10);
                boardsCount = parseInt(results[0].result.length, 10);
            }
        }

        html.replaceContent(
            document.getElementById('boot-reports-count'),
            document.createTextNode(b.formatNumber(reportsCount)));
        html.replaceContent(
            document.getElementById('boot-boards-count'),
            document.createTextNode(b.formatNumber(boardsCount)));
    }

    function getDetailsCount() {
        var batchQueries,
            deferred;

        batchQueries = new Array(2);
        batchQueries[0] = {
            method: 'GET',
            operation_id: 'boot-reports-count',
            resource: 'count',
            document: 'boot',
            query: 'job=' + jobName + '&limit=' + numberRange
        };

        batchQueries[1] = {
            method: 'GET',
            operation_id: 'boot-boards-count',
            resource: 'boot',
            query: 'job=' + jobName + '&limit=' + numberRange +
                '&aggregate=board&field=board'
        };

        deferred = r.post(
            '/_ajax/batch',
            JSON.stringify({
                batch: batchQueries
            })
        );
        $.when(deferred)
            .fail(e.error, getDetailsCountFail)
            .done(getDetailsCountDone);
    }

    function getBootsCountFail() {
        html.replaceByClass('fail-badge', '&infin;');
        html.replaceByClass('success-badge', '&infin;');
    }

    function _parseBootsCount(result) {
        var count;

        count = parseInt(result.result[0].count, 10);
        html.replaceContent(
            document.getElementById(result.operation_id),
            document.createTextNode(b.formatNumber(count)));
    }

    function getBootsCountDone(response) {
        var results;

        results = response.result;
        if (results.length === 0) {
            html.replaceByClass('fail-badge', '&#63;');
            html.replaceByClass('success-badge', '&#63;');
        } else {
            results.forEach(_parseBootsCount);
        }
        // Re-enable the search here.
        bootsTable
            .pageLen(pageLen)
            .search(searchFilter);
    }

    function getBootsCount(response) {
        var batchElements,
            batchQueries,
            deferred,
            idx,
            jdx,
            kernel,
            queriesLen,
            results;

        batchElements = 2;
        results = response.result;
        queriesLen = results.length * batchElements;
        idx = 0;

        if (results.length > 0) {
            batchQueries = new Array(queriesLen);
            for (idx; idx < queriesLen; idx = idx + batchElements) {
                jdx = idx;
                kernel = results[idx / batchElements].kernel;
                batchQueries[idx] = {
                    method: 'GET',
                    operation_id: 'success-count-' + kernel,
                    resource: 'count',
                    document: 'boot',
                    query: 'status=PASS&job=' + jobName + '&kernel=' +
                        kernel
                };
                batchQueries[jdx + 1] = {
                    method: 'GET',
                    operation_id: 'fail-count-' + kernel,
                    resource: 'count',
                    document: 'boot',
                    query: 'status=FAIL&job=' + jobName + '&kernel=' +
                        kernel
                };
            }

            deferred = r.post(
                '/_ajax/batch',
                JSON.stringify({
                    batch: batchQueries
                })
            );
            $.when(deferred)
                .fail(e.error, getBootsCountFail)
                .done(getBootsCountDone);
        }
    }

    function getBootsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading board data.'));
    }

    function getBootsDone(response) {
        var columns,
            results,
            rowURLFmt;

        results = response.result;
        if (results.length === 0) {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No board data found'));
        } else {
            rowURLFmt = '/boot/all/job/%(job)s/kernel/%(kernel)s/';

            columns = [
                {
                    data: '_id',
                    visible: false,
                    searchable: false,
                    orderable: false
                },
                {
                    data: 'kernel',
                    title: 'Kernel'
                },
                {
                    data: 'kernel',
                    title: 'Successful',
                    className: 'pull-center',
                    render: boot.renderTableKernelCountSuccess
                },
                {
                    data: 'kernel',
                    title: 'Failed',
                    className: 'pull-center',
                    render: boot.renderTableKernelCountFail
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    className: 'date-column pull-center',
                    render: boot.renderTableDate
                },
                {
                    data: 'job',
                    title: '',
                    width: '30px',
                    searchable: false,
                    orderable: false,
                    className: 'pull-center',
                    render: boot.renderTableDetailJob
                }
            ];

            bootsTable
                .tableData(results)
                .columns(columns)
                .order([4, 'desc'])
                .rowURL(rowURLFmt)
                .rowURLElements(['job', 'kernel'])
                .noIDUrl(true)
                .lengthChange(false)
                .paging(false)
                .info(false)
                .draw();
        }
    }

    function getBoots() {
        var deferred;

        deferred = r.get(
            '/_ajax/boot',
            {
                aggregate: 'kernel',
                job: jobName,
                sort: 'created_on',
                sort_order: -1,
                limit: numberRange,
                field: ['job', 'kernel', 'created_on']
            }
        );
        $.when(deferred)
            .fail(e.error, getBootsFail)
            .done(getBootsDone, getBootsCount);
    }

    // Setup and perform base operations.
    init.hotkeys();
    init.tooltip();

    if (document.getElementById('job-name') !== null) {
        jobName = document.getElementById('job-name').value;
    }
    if (document.getElementById('number-range') !== null) {
        numberRange = document.getElementById('number-range').value;
    }
    if (document.getElementById('search-filter') !== null) {
        searchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        pageLen = document.getElementById('page-len').value;
    }

    bootsTable = t(['boots-table', 'table-loading', 'table-div'], true);
    getDetailsCount();
    getBoots();
});
