<template>
    <div class="pt-8 pb-16">
        <section v-if="showTools">
            <p-select-btn-group class="pr-4 mb-8" :buttons="tools" :selected.sync="selectedToolId" />
        </section>
        <section class="mb-8">
            <span class="title">
                {{ $t('COMMON.MONITORING.RESOURCE') }}
            </span>
            <span class="ml-4 text-gray text-sm">
                * {{ $t('COMMON.MONITORING.LIMIT_OF_RESOURCE', {
                    limitCount: 10,
                }) }}
            </span>
            <div>
                <div v-for="(resource, idx) in availableResources" :key="resource.id" class="legend">
                    <span class="flex-shrink-0 rounded-sm h-3 w-3 mr-2"
                          :style="{ backgroundColor: colors[idx] }"
                    />
                    <span>{{ legendFormatter(resource) }}</span>
                </div>
            </div>
        </section>
        <section class="toolbox-section">
            <div class="inline-flex items-center">
                <span class="title mr-4 flex-shrink-0">{{ $t('COMMON.MONITORING.TIME_RANGE') }}</span>
                <p-select-btn-group class="time-range" :buttons="timeRanges" :selected.sync="selectedTimeRange" />
            </div>
            <div class="inline-flex items-center">
                <span class="title mr-4 flex-shrink-0">{{ $t('COMMON.MONITORING.STATISTICS') }}</span>
                <p-select-dropdown v-model="selectedStat" :items="statItems" />
                <p-icon-button class="ml-4 flex-shrink-0" name="ic_refresh" @click="listChartMetrics" />
            </div>
        </section>
        <section class="py-4">
            <i18n path="COMMON.MONITORING.DISPLAY_TIMEZONE" tag="p" class="text-sm text-gray mb-12">
                <template #timezone>
                    <strong>{{ $t('COMMON.MONITORING.LOCAL_TIME') }}</strong>
                </template>
            </i18n>
            <div v-if="metricsLoading">
                <p-lottie class="loader" name="thin-spinner" auto
                          :size="2"
                />
            </div>
            <div v-else-if="metrics.length === 0" class="text-center text-gray">
                {{ $t('COMMON.MONITORING.NO_METRICS') }}
            </div>
            <template v-else>
                <p-grid-layout :items="chartMetrics" row-gap="3rem" column-gap="1rem"
                               card-height="auto"
                               card-min-width="23.125rem"
                               card-max-width="23.125rem"
                               :card-class="() => []"
                >
                    <template #card="{item, index}">
                        <metric-chart :loading="chartMetrics[index].loading"
                                      :labels="chartMetrics[index].labels"
                                      :dataset="chartMetrics[index].dataset"
                                      :colors="colors"
                                      :unit="item.metric.unit"
                                      :timezone="timezone"
                                      :title="item.metric.name"
                                      :error="item.error"
                        />
                    </template>
                </p-grid-layout>
                <p-button v-if="chartMetrics.length !== metrics.length"
                          :outline="true"
                          style-type="black" class="more-btn"
                          @click="loadChartMetrics"
                >
                    {{ $t('COMMON.MONITORING.MORE') }}
                </p-button>
            </template>
        </section>
    </div>
</template>

<script lang="ts">
/* eslint-disable camelcase */
import {
    computed, onMounted, reactive, toRefs, watch,
} from '@vue/composition-api';

import MetricChart from '@/common/components/metric-chart/MetricChart.vue';
import {
    PSelectBtnGroup, PSelectDropdown, PIconButton, PGridLayout, PLottie, PButton,
} from '@spaceone/design-system';

import {
    blue, coral, green, peacock, violet, yellow, indigo,
} from '@/styles/colors';
import {
    some, debounce, find, capitalize, chain, range, sortBy,
} from 'lodash';
import { MonitoringProps } from '@/common/modules/monitoring/type';
import { SpaceConnector } from '@/lib/space-connector';
import { TimeStamp } from '@/models';
import dayjs, { Dayjs } from 'dayjs';
import { store } from '@/store';


export enum DataSourceState {
    enabled = 'ENABLED',
    disabled = 'DISABLED'
}

export enum MONITORING_TYPE {
    metric = 'METRIC',
    log = 'LOG',
}


enum STATISTICS_TYPE {
    average = 'AVERAGE',
    maximum = 'MAXIMUM',
    minimum = 'MINIMUM'
}


interface MetricParameter {
    data_source_id: string;
    resource_type: string;
    resources: string[];
}

interface MetricResp {
    key: string;
    name: string;
    unit: {
        x: string;
        y: string;
    };
    chart_type: string;
    chart_options: any;
}

interface MetricListResp {
    metrics: MetricResp[];
    available_resources: {
        [key: string]: boolean;
    };
}

interface ChartMetric {
    loading: boolean;
    labels: string[];
    dataset: {[resourceKey: string]: number[]};
    metric: MetricResp;
    error?: boolean;
}

interface DataToolType {
    id: string;
    name: string;
    statisticsTypes: STATISTICS_TYPE[];
}


const colors = [
    coral[500], blue[500], violet[500], yellow[600], green[400], coral[400], peacock[600], coral[700],
    peacock[400], green[700], green[500], blue[400], indigo[700], violet[400], indigo[400], blue[700],
];
const timeRanges = ['1h', '3h', '6h', '12h', '1d', '3d', '1w', '2w'];
const LOAD_LIMIT = 12;

const getTimestamp = (dayjsTime: Dayjs) => ({
    seconds: `${dayjsTime.unix()}`,
    nanos: 0,
});

export default {
    name: 'Monitoring',
    components: {
        PButton,
        PLottie,
        PGridLayout,
        PSelectDropdown,
        PSelectBtnGroup,
        PIconButton,
        MetricChart,
    },
    props: {
        resourceType: {
            type: String,
            default: null,
        },
        resources: {
            type: Array,
            default: () => [],
            validator(resources) {
                return resources.every(resource => resource.id);
            },
        },
        showTools: {
            type: Boolean,
            default: true,
        },
    },
    setup(props: MonitoringProps) {
        const state = reactive({
            timezone: store.state.user.timezone,
            dataTools: [],
            selectedToolId: '',
            tools: computed<DataToolType[]>(() => state.dataTools.map(d => ({
                name: d.id,
                label: d.name,
            }))),
            selectedTimeRange: '1h',
            statisticsTypes: computed(() => {
                const tool = find(
                    state.dataTools,
                    { id: state.selectedToolId },
                );
                return tool ? tool.statisticsTypes : [STATISTICS_TYPE.average];
            }),
            statItems: computed(() => state.statisticsTypes.map(d => ({
                type: 'item', label: capitalize(d), name: d,
            }))),
            selectedStat: STATISTICS_TYPE.average,
            metricsLoading: true,
            metrics: [],
            chartMetrics: [],
            availableResources: [],
            noData: false,
        });

        const dataSourceApi = SpaceConnector.client.monitoring.dataSource.list;
        const listDataSources = async () => {
            try {
                const res = await dataSourceApi({ monitoring_type: MONITORING_TYPE.metric });
                state.dataTools = chain(res.results)
                    .map((d) => {
                        if (d.plugin_info.options.supported_resource_type.some(t => props.resourceType === t)) {
                            return {
                                id: d.data_source_id,
                                name: d.name,
                                statisticsTypes: d.plugin_info.options.supported_stat || [STATISTICS_TYPE.average],
                            };
                        }
                        return undefined;
                    }).compact().uniqBy('id')
                    .value();
                state.selectedToolId = state.dataTools[0].id;
            } catch (e) {
                console.error(e);
            }
        };

        const metricListApi = SpaceConnector.client.monitoring.metric.list;
        const listMetrics = async (): Promise<MetricListResp> => {
            state.metricsLoading = true;
            try {
                if (state.dataTools.length === 0) await listDataSources();
                const res = await metricListApi({
                    resource_type: props.resourceType,
                    data_source_id: state.selectedToolId,
                    resources: props.resources.map(d => d.id),
                });
                return res;
            } catch (e) {
                console.error(e);
            } finally {
                state.metricsLoading = false;
            }
            return {
                metrics: [],
                available_resources: {},
            };
        };

        const getStartTimestamp = (end: Dayjs): TimeStamp => {
            const units = state.selectedTimeRange.match(/[^0-9]/g) || [];
            return getTimestamp(end.subtract(
                parseInt(state.selectedTimeRange),
                    units[0] as 'w'|'d'|'h',
            ));
        };


        const chartMetricApi = SpaceConnector.client.monitoring.metric.getData;
        const getChartMetric = async (params: any, chart: ChartMetric): Promise<void> => {
            chart.loading = true;
            try {
                params.metric = chart.metric.key;
                const res = await chartMetricApi(params);
                chart.labels = res.labels;
                chart.dataset = res.resource_values;
                chart.error = false;
            } catch (e) {
                console.error(e);
                chart.error = true;
            } finally {
                chart.loading = false;
            }
        };

        const getChartMetricParam = () => {
            const now = dayjs();
            return {
                data_source_id: state.selectedToolId,
                resource_type: props.resourceType,
                stat: state.selectedStat,
                end: getTimestamp(now),
                start: getStartTimestamp(now),
                resources: state.availableResources.map(d => d.id),
            };
        };

        const listChartMetrics = debounce(async (start = 0): Promise<void> => {
            if (state.availableResources.length === 0) return;
            try {
                const params = getChartMetricParam();
                await Promise.all(
                    range(start, state.chartMetrics.length)
                        .map(i => getChartMetric(
                            { ...params },
                            state.chartMetrics[i],
                        )),
                );
            } catch (e) {
                console.error(e);
            }
        }, 300);

        const setAvailableResources = (data): void => {
            let count = 0;
            state.availableResources = [];
            some(props.resources, (resource, i) => {
                if (data[resource.id]) {
                    state.availableResources.push(resource);
                    count++;
                }
                return count === 10;
            });
        };

        const initChartMetrics = (start = 0): void => {
            let endIdx = start + LOAD_LIMIT;
            if (endIdx > state.metrics.length) endIdx = state.metrics.length;

            range(start, endIdx).forEach((current) => {
                state.chartMetrics[current] = {
                    dataset: {},
                    labels: [],
                    loading: true,
                    metric: state.metrics[current],
                };
            });
            state.chartMetrics = [...state.chartMetrics];
        };

        const reset = (): void => {
            state.metricsLoading = true;
            state.chartMetrics = [];
            state.metrics = [];
            state.availableResources = [];
        };

        const loadChartMetrics = async () => {
            const start = state.chartMetrics.length;
            initChartMetrics(start);
            await listChartMetrics(start);
        };

        const listAll = debounce(async (): Promise<void> => {
            reset();

            const metricInfo = await listMetrics();
            state.metrics = sortBy(metricInfo.metrics, m => m.name);

            setAvailableResources(metricInfo.available_resources);

            if (state.metrics.length === 0) return;
            initChartMetrics();
            await listChartMetrics();
        }, 300);


        onMounted(() => {
            watch(() => state.statisticsTypes, (types) => {
                if (types) state.selectedStat = types[0] || STATISTICS_TYPE.average;
            }, { immediate: true });

            watch([() => props.resources, () => state.selectedToolId], (resources, toolId) => {
                if (resources.length > 0 && toolId) listAll();
            }, { immediate: false });

            watch([() => state.selectedTimeRange, () => state.selectedStat], (timeRange, stat) => {
                if (timeRange && stat) listChartMetrics();
            }, { immediate: false });

            listAll();
        });

        return {
            ...toRefs(state),
            colors,
            timeRanges,
            legendFormatter(resource): string {
                return resource.name ? `${resource.id} (${resource.name})` : resource.id;
            },
            listChartMetrics,
            loadChartMetrics,
        };
    },
};
</script>

<style lang="postcss" scoped>
section {
    @apply px-4;
}
.toolbox-section {
    @apply flex justify-between border-t border-b border-gray-200 py-4;
}
.title {
    @apply text-sm font-bold capitalize;
}
.legend {
    @apply inline-flex items-center text-sm leading-normal mr-4;
    margin-top: 0.625rem;
}
.time-range::v-deep {
    &.p-select-btn-group .select-btn {
        margin-right: 0;
        padding: 0 0.75rem;
        font-weight: normal;
        font-size: 0.875rem;
        &.active {
            @apply text-secondary font-bold;
        }
    }
}
.more-btn::v-deep {
    @apply border-gray-300 mt-12 block mx-auto;
    max-width: 38rem;
    width: 40%;
}
.loader {
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
