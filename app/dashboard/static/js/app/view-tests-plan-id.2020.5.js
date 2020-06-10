/*!
 * kernelci dashboard.
 *
 * Copyright (C) 2020 Collabora Limited
 * Author: Guillaume Tucker <guillaume.tucker@collabora.com>
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */

require([
    'jquery',
    'charts/passpie',
    'components/test/common',
    'tables/test',
    'utils/error',
    'utils/init',
    'utils/html',
    'utils/request',
    'utils/table',
    'utils/urls',
    'URI',
], function($, pieChart, tcommon, ttable, error, init, html, request, table,
            urls, URI) {
    'use strict';

    var gPlanId;
    var gFileServer;
    var gTestsTable;

    setTimeout(function() {
        document.getElementById('li-test').setAttribute('class', 'active');
    }, 15);

    function detailsFailed() {
        html.replaceByClassTxt('loading-content', '?');
    }

    function updateDetails(results) {
        var job;
        var branch;
        var kernel;
        var treeNode;
        var jobLink;
        var describeNode;
        var buildsNode;
        var buildsLink;
        var testsNode;
        var testsLink;
        var gitNode;
        var createdOn;
        var dateNode;
        var translatedURI;
        var logNode;
        var branchNode;
        var branchLink;

        job = results.job;
        branch = results.git_branch;
        kernel = results.kernel;

        treeNode = html.tooltip();
        treeNode.title = "Details for tree &#171;" + job + "&#187;";
        jobLink = document.createElement('a');
        jobLink.href = "/job/" + job + "/";
        jobLink.appendChild(html.tree());
        treeNode.appendChild(document.createTextNode(job));
        treeNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        treeNode.appendChild(jobLink);

        // Branch.
        branchNode = html.tooltip();
        branchNode.title =
            "Branch reports for &#171;" + job + "&#187; - " + branch;
        branchLink = document.createElement('a');
        branchLink.href = "/job/" + job + "/branch/" + branch;
        branchLink.appendChild(html.tree());
        branchNode.appendChild(document.createTextNode(branch));
        branchNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        branchNode.appendChild(branchLink);

        describeNode = document.createElement('span')
        buildsNode = html.tooltip();
        buildsNode.title =
            "Build reports for &#171;" + job + "&#187; - " + kernel;
        buildsLink = document.createElement('a');
        buildsLink.href = "/build/" + job + "/branch/" + branch + "/kernel/" + kernel;
        buildsLink.appendChild(html.build());
        buildsNode.appendChild(document.createTextNode(kernel));
        buildsNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        buildsNode.appendChild(buildsLink);
        testsNode = html.tooltip();
        testsNode.title =
            "Test reports for &#171;" + job + "&#187; - " + kernel;
        testsLink = document.createElement('a');
        testsLink.href =
            "/test/job/" + job + "/branch/" + branch + "/kernel/" + kernel;
        testsLink.appendChild(html.boot());
        testsNode.appendChild(testsLink);
        describeNode.appendChild(buildsNode);
        describeNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        describeNode.appendChild(testsNode);

        gitNode = document.createElement('a');
        gitNode.appendChild(document.createTextNode(results.git_url));
        gitNode.href = results.git_url;
        gitNode.title = "Git URL";

        createdOn = new Date(results.created_on.$date);
        dateNode = document.createElement('time');
        dateNode.setAttribute('datetime', createdOn.toISOString());
        dateNode.appendChild(
            document.createTextNode(createdOn.toCustomISODate()));

        translatedURI = urls.createFileServerURL(gFileServer, results);
        logNode = tcommon.logsNode(
            results.boot_log, results.boot_log_html, results.lab_name,
            translatedURI[0], translatedURI[1]);

        html.replaceContent(
            document.getElementById('lab-name'),
            document.createTextNode(results.lab_name));
        html.replaceContent(
            document.getElementById('plan-name'),
            document.createTextNode(results.name));
        html.replaceContent(
            document.getElementById('device-type'),
            document.createTextNode(results.device_type));
        html.replaceContent(
            document.getElementById('tree'), treeNode);
        html.replaceContent(
            document.getElementById('git-branch'), branchNode);
        html.replaceContent(
            document.getElementById('git-describe'), describeNode);
        html.replaceContent(
            document.getElementById('git-url'), gitNode);
        html.replaceContent(  /* ToDo: link to commit when possible */
            document.getElementById('git-commit'),
            document.createTextNode(results.git_commit));
        html.replaceContent(
            document.getElementById('arch'),
            document.createTextNode(results.arch));
        html.replaceContent(
            document.getElementById('defconfig'),
            document.createTextNode(results.defconfig_full));
        html.replaceContent(
            document.getElementById('compiler'),
            document.createTextNode(results.compiler_version_full));
        html.replaceContent(
            document.getElementById('job-date'), dateNode);
        html.replaceContent(
            document.getElementById('job-log'), logNode);
    }

    function updateChart(testCount) {
        function countTests(tc) {
            return [
                tc['total'],
                [tc['pass'], tc['regressions'], tc['unknown']]
            ];
        }

        pieChart.testpie({
            element: 'test-chart',
            countFunc: countTests,
            response: testCount,
            legend: true,
            legendIds: {
                'pass': '#show-pass',
                'fail': '#show-fail',
                'unknown': '#show-unknown',
            },
            legendTitles: {
                'pass': 'Successful',
                'fail': 'Regressions',
                'unknown': 'Unknown',
            },
            size: {
                height: 200,
                width: 200,
            },
            radius: {inner: -30, outer: -42},
        });
    }

    function listenForTableEvents(testCount) {
        var btnList = ['total', 'pass', 'regressions', 'unknown'];

        function _tableFilter(event) {
            var activeId = event.target.id;
            var status = activeId.substring('btn-'.length);

            if (status == 'total') {
                status = '';
            } else if (status == 'regressions') {
                status = 'fail';
            }

            gTestsTable.table.column(2).search(status).draw();

            btnList.forEach(function(id) {
                var btnId = 'btn-' + id;
                var ele = document.getElementById(btnId);

                if (btnId == activeId) {
                    html.addClass(ele, 'active');
                } else {
                    html.removeClass(ele, 'active');
                }
            });
        }

        btnList.forEach(function(id) {
            var ele = document.getElementById('btn-' + id);
            ele.addEventListener('click', _tableFilter, true);
            if (testCount[id])
                ele.removeAttribute('disabled');
            if (id == 'total')
                html.addClass(ele, 'active');
        });
    }

    function updateTestsTable(results) {
        var columns;
        var data;

        function _renderMeasurements(measurements, type) {
            var mesList;

            if (type != "display")
                return;

            if (!measurements.length)
                return "-";

            mesList = document.createElement('ul');
            mesList.className = 'measurements';

            measurements.forEach(function(data) {
                var mes = document.createElement('li');
                var msg = data['value'] + " " + data['unit'];
                mes.appendChild(document.createTextNode(msg));
                mesList.appendChild(mes);
            });

            return mesList.outerHTML;
        }

        function _renderStatus(data, type) {
            if (type == "display") {
                var node = document.createElement('div');
                node.appendChild(ttable.statusNode(data));
                return node.outerHTML;
            } else {
                return data;
            }
        }

        data = [];
        results.forEach(function(item) {
            var status;

            if (item.status == 'PASS')
                status = 'PASS';
            else if (item.regression_id)
                status = 'FAIL';
            else
                status = 'UNKNOWN';

            data.push({
                '_id': item._id,
                'test_case_path': item.test_case_path,
                'measurements': item.measurements,
                'status': status,
            });
        });

        columns = [
            {
                title: 'Test case path',
                data: 'test_case_path',
                type: 'string',
                className: 'test-group-column',
            },
            {
                title: 'Measurements',
                data: 'measurements',
                type: 'string',
                className: 'test-group-column',
                searchable: false,
                orderable: false,
                render: _renderMeasurements,
            },
            {
                title: 'Status',
                data: 'status',
                type: 'string',
                className: 'pull-center',
                searchable: true,
                orderable: false,
                render: _renderStatus,
            },
        ];

        gTestsTable
            .data(data)
            .columns(columns)
            .order([0, 'asc'])
            .rowURL('/test/case/id/%(_id)s/')
            .rowURLElements(['_id'])
            .paging(true)
            .info(false)
            .draw();
    }

    function getTestsFailed() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('No test data available.')
        );
    }

    function getTestsDone(response) {
        if (response.result.length === 0) {
            getTestsFailed();
            return;
        }

        updateTestsTable(response.result);
    }

    function getTests(results) {
        var data;
        var deferred;

        data = {
            arch: results.arch,
            build_environment: results.build_environment,
            defconfig_full: results.defconfig_full,
            device_type: results.device_type,
            git_branch: results.git_branch,
            job: results.job,
            kernel: results.kernel,
            lab_name: results.lab_name,
            plan: results.name,
            sort: 'test_case_path',
        };

        deferred = request.get('/_ajax/test/case', data);
        $.when(deferred)
            .fail(error.error, getTestsFailed)
            .done(getTestsDone);
    }

    function testCountFailed() {
        /* The chart will not be shown */
    }

    function testCountDone(response) {
        var results = response.result;
        var testCount;

        testCount = {
            'total': results[0].result[0].count,
            'pass': results[1].result[0].count,
            'regressions': results[2].result[0].count,
            'unknown': results[3].result[0].count,
        };
        updateChart(testCount);
        listenForTableEvents(testCount);
    }

    function getTestCount(results) {
        var qStr;
        var batchOps;
        var deferred;

        qStr = URI.buildQuery({
            arch: results.arch,
            build_environment: results.build_environment,
            defconfig_full: results.defconfig_full,
            device_type: results.device_type,
            git_branch: results.git_branch,
            job: results.job,
            kernel: results.kernel,
            lab_name: results.lab_name,
            plan: results.name,
        });

        batchOps = [];

        batchOps.push({
            method: 'GET',
            operation_id: 'test-total-count',
            resource: 'count',
            document: 'test_case',
            query: qStr,
        });

        batchOps.push({
            method: 'GET',
            operation_id: 'test-success-count',
            resource: 'count',
            document: 'test_case',
            query: qStr + '&status=PASS',
        });

        batchOps.push({
            method: 'GET',
            operation_id: 'test-fail-count',
            resource: 'count',
            document: 'test_regression',
            query: qStr,
        });

        batchOps.push({
            method: 'GET',
            operation_id: 'test-unknown-count',
            resource: 'count',
            document: 'test_case',
            query: qStr + '&status=FAIL&status=SKIP&regression_id=null',
        });

        deferred = request.post(
            '/_ajax/batch', JSON.stringify({batch: batchOps}));

        $.when(deferred)
            .fail(error.error, testCountFailed)
            .done(testCountDone);
    }

    function getPlanFailed() {
        detailsFailed();
    }

    function getPlanDone(response) {
        var results = response.result[0];

        updateDetails(results);
        getTests(results);
        getTestCount(results);
    }

    function getPlan() {
        if (!gPlanId) {
            getPlanFailed();
            return;
        }

        $.when(request.get('/_ajax/test/group', {id: gPlanId}))
            .fail(error.error, getPlanFailed)
            .done(getPlanDone);
    }

    if (document.getElementById('plan-id') !== null) {
        gPlanId = document.getElementById('plan-id').value;
    }
    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }

    gTestsTable = table({
        tableId: 'tests-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div',
    });

    setTimeout(getPlan, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
