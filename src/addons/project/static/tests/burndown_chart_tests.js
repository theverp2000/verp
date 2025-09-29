/** @verp-module */

import { click } from "@web/../tests/helpers/utils";
import { COLORS, hexToRGBA } from "@web/views/graph/colors";
import { dialogService } from "@web/core/dialog/dialog_service";
import { getGraphRenderer } from "@web/../tests/views/graph_view_tests";
import { makeView } from "@web/../tests/views/helpers";
import { registry } from "@web/core/registry";
import { setupControlPanelServiceRegistry } from "@web/../tests/search/helpers";

const serviceRegistry = registry.category("services");
QUnit.module("Project", {}, () => {
    QUnit.module("Views", (hooks) => {
        let serverData;
        hooks.beforeEach(async () => {
            serverData = {
                models: {
                    burndownChart: {
                        fields: {
                            date: { string: "Date", type: "date", store: true, sortable: true },
                            projectId: { string: "Project", type: "many2one", relation: "project", store: true, sortable: true },
                            stageId: { string: "Stage", type: "many2one", relation: "stage", store: true, sortable: true },
                            nbTasks: { string: "Number of Tasks", type: "integer", store: true, sortable: true, groupOperator: "sum" }
                        },
                        records: [
                            { id: 1, projectId: 1, stageId: 1, date: "2020-01-01", nbTasks: 10 },
                            { id: 2, projectId: 1, stageId: 2, date: "2020-02-01", nbTasks: 5 },
                            { id: 3, projectId: 1, stageId: 3, date: "2020-03-01", nbTasks: 2 },
                        ],
                    },
                    project: {
                        fields: {
                            name: { string: "Project Name", type: "char" },
                        },
                        records: [{ id: 1, label: "Project A" }]
                    },
                    stage: {
                        fields: {
                            name: { string: "Stage Name", type: "char" },
                        },
                        records: [
                            { id: 1, label: "Todo" },
                            { id: 2, label: "In Progress" },
                            { id: 3, label: "Done" },
                        ],
                    }
                },
                views: {
                    "burndownChart,false,graph": `
                        <graph type="line">
                            <field name="date" string="Date" interval="month"/>
                            <field name="stageId"/>
                            <field name="nbTasks" type="measure"/>
                        </graph>
                    `,
                },
            };
            setupControlPanelServiceRegistry();
            serviceRegistry.add("dialog", dialogService);
        });

        QUnit.module("BurndownChart");

        QUnit.test("check if default mode is line chart and line chart is stacked for burndown chart", async function (assert) {
            assert.expect(5);

            const burndownChart = await makeView({
                serverData,
                resModel: "burndownChart",
                type: "burndownChart",
            });

            assert.strictEqual(burndownChart.model.metaData.mode, "line", "should be in line chart mode.");
            assert.ok(burndownChart.model.metaData.stacked, "should be stacked by default.");

            assert.ok(getGraphRenderer(burndownChart).getScaleOptions().yAxes.every(y => y.stacked), "the stacked property in y axes should be true when the stacked is enabled in line chart");
            assert.ok(getGraphRenderer(burndownChart).getElementOptions().line.fill, "The fill property should be true to add backgroundColor in line chart.");

            const actualDatasets = [];
            const expectedDatasets = [];
            const keysToEvaluate = ["backgroundColor", "borderColor", "originIndex", "pointBackgroundColor"];
            const datasets = getGraphRenderer(burndownChart).chart.data.datasets;

            for (let i = 0; i < datasets.length; i++) {
                const dataset = datasets[i];
                const actualDataset = {};
                keysToEvaluate.forEach(key => {
                    if (dataset.hasOwnProperty(key)) {
                        actualDataset[key] = dataset[key];
                    }
                });
                actualDatasets.push(actualDataset);

                const expectedColor = COLORS[i];
                expectedDatasets.push({
                    backgroundColor: hexToRGBA(expectedColor, 0.4),
                    borderColor: expectedColor,
                    originIndex: 0,
                    pointBackgroundColor: expectedColor,
                });
            }
            assert.deepEqual(actualDatasets, expectedDatasets);
        });

        QUnit.test("check if the stacked button is visible in the line chart", async function (assert) {
            assert.expect(3);
            const burndownChart = await makeView({
                serverData,
                resModel: "burndownChart",
                type: "burndownChart",
            });
            assert.ok(burndownChart.model.metaData.stacked, "graph should be a burndown chart.");
            assert.containsOnce(burndownChart, `button.o-graph-button[data-tooltip="Stacked"]`);
            const stackButton = burndownChart.el.querySelector(`button.o-graph-button[data-tooltip="Stacked"]`);
            await click(stackButton);
            assert.notOk(burndownChart.model.metaData.stacked, "graph should be a classic line chart.");
        });

        QUnit.test("check if it is classic line chart when stacked prop is false in line chart", async function (assert) {
            assert.expect(4);

            const burndownChart = await makeView({
                serverData,
                resModel: "burndownChart",
                type: "burndownChart",
            });

            const stackButton = burndownChart.el.querySelector(`button.o-graph-button[data-tooltip="Stacked"]`);
            await click(stackButton);
            assert.notOk(burndownChart.model.metaData.stacked, "graph should be a classic line chart.");

            assert.notOk(getGraphRenderer(burndownChart).getScaleOptions().yAxes.every(y => y.stacked), "the y axes should have a stacked property set to false since the stacked property in line chart is false.");
            assert.notOk(getGraphRenderer(burndownChart).getElementOptions().line.fill, "The fill property should be false since the stacked property is false.");

            const actualDatasets = [];
            const expectedDatasets = [];
            const keysToEvaluate = ["backgroundColor", "borderColor", "originIndex", "pointBackgroundColor"];
            const datasets = getGraphRenderer(burndownChart).chart.data.datasets;

            for (let i = 0; i < datasets.length; i++) {
                const dataset = datasets[i];
                const actualDataset = {};
                keysToEvaluate.forEach(key => {
                    if (dataset.hasOwnProperty(key)) {
                        actualDataset[key] = dataset[key];
                    }
                });
                actualDatasets.push(actualDataset);

                const expectedColor = COLORS[i];
                expectedDatasets.push({
                    borderColor: expectedColor,
                    originIndex: 0,
                    pointBackgroundColor: expectedColor,
                });
            }

            assert.deepEqual(actualDatasets, expectedDatasets);
        });
    });
});
