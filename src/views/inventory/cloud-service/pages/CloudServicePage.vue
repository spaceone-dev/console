<template>
    <vertical-page-layout :min-width="0" :init-width="260" :max-width="400">
        <template #sidebar>
            <div class="sidebar-title">
                <p-lazy-img :src="sidebarState.iconUrl"
                            :loading="!sidebarState.iconUrl"
                            width="1.5rem" height="1.5rem"
                />
                <p class="sidebar-title-text">
                    {{ sidebarState.group }}
                </p>
            </div>
            <p-divider class="sidebar-divider" />
            <div v-for="(item) in sidebarState.items" :key="item.id"
                 class="sidebar-list-item"
                 :class="{'selected': item.name === sidebarState.selectedItem.name}"
                 @click="onClickSidebarItem(item)"
            >
                {{ item.name }}
            </div>
        </template>
        <template #default>
            <div class="page-navigation">
                <p-breadcrumbs :routes="routeState.route" />
            </div>
            <template v-if="sidebarState.hasServer">
                <server-main v-show="sidebarState.selectedItem.type === 'inventory.Server'"
                             :is-cloud-service="true"
                             :provider="provider"
                             :cloud-service-type="sidebarState.serverCloudServiceType"
                             :cloud-service-group="group"
                />
            </template>
            <template v-if="sidebarState.selectedItem.type !== 'inventory.Server'">
                <p-page-title :title="name"
                              child
                              use-total-count
                              use-selected-count
                              :total-count="typeOptionState.totalCount"
                              :selected-count="tableState.selectedItems.length"
                              @goBack="$router.go(-1)"
                />
                <p-horizontal-layout :height="tableState.tableHeight" @drag:end="onTableHeightChange">
                    <template #container="{ height }">
                        <template v-if="tableState.schema">
                            <p-dynamic-layout type="query-search-table"
                                              :options="tableState.schema.options"
                                              :data="tableState.items"
                                              :fetch-options="fetchOptionState"
                                              :type-options="typeOptionState"
                                              :style="{height: `${height}px`}"
                                              :field-handler="fieldHandler"
                                              @init="fetchTableData"
                                              @fetch="fetchTableData"
                                              @select="onSelect"
                                              @export="exportCloudServiceData"
                            >
                                <template #toolbox-left>
                                    <p-icon-text-button style-type="primary-dark"
                                                        name="ic_plus_bold"
                                                        disabled
                                                        @click="clickCollectData"
                                    >
                                        {{ $t('INVENTORY.CLOUD_SERVICE.PAGE.COLLECT_DATA') }}
                                    </p-icon-text-button>

                                    <p-dropdown-menu-btn class="left-toolbox-item mr-4"
                                                         :menu="tableState.dropdown"
                                                         @click-project="clickProject"
                                    >
                                        {{ $t('INVENTORY.CLOUD_SERVICE.PAGE.ACTION') }}
                                    </p-dropdown-menu-btn>
                                </template>
                            </p-dynamic-layout>
                        </template>
                    </template>
                </p-horizontal-layout>
                <p-tab v-if="tableState.selectedItems.length === 1"
                       :tabs="singleItemTabState.tabs"
                       :active-tab.sync="singleItemTabState.activeTab"
                >
                    <template #detail>
                        <cloud-service-detail
                            :cloud-service-id="tableState.selectedCloudServiceIds[0]"
                            :provider="provider"
                            :cloud-service-group="group"
                            :cloud-service-type="name"
                        />
                    </template>

                    <template #tag>
                        <tags-panel :resource-id="tableState.selectedCloudServiceIds[0]"
                                    resource-type="inventory.CloudService"
                                    resource-key="cloud_service_id"
                        />
                    </template>
                    <template #member>
                        <cloud-service-admin :cloud-service-ids="tableState.selectedCloudServiceIds" />
                    </template>
                    <template #history>
                        <cloud-service-history :cloud-service-id="tableState.selectedCloudServiceIds[0]" />
                    </template>
                    <template #monitoring>
                        <monitoring :resource-type="monitoringState.resourceType"
                                    :resources="monitoringState.resources"
                        />
                    </template>
                </p-tab>
                <p-tab v-else-if="typeOptionState.selectIndex.length > 1"
                       :tabs="multiItemTabState.tabs"
                       :active-tab.sync="multiItemTabState.activeTab"
                >
                    <template #data>
                        <p-dynamic-layout v-if="tableState.multiSchema"
                                          type="simple-table"
                                          :options="tableState.multiSchema.options"
                                          :type-options="{ colCopy: true, timezone: typeOptionState.timezone }"
                                          :data="tableState.selectedItems"
                                          :field-handler="fieldHandler"
                                          class="selected-data-tab"
                        />
                    </template>
                    <template #member>
                        <cloud-service-admin :cloud-service-ids="tableState.selectedCloudServiceIds" />
                    </template>
                    <template #monitoring>
                        <monitoring :resource-type="monitoringState.resourceType"
                                    :resources="monitoringState.resources"
                        />
                    </template>
                </p-tab>
                <p-empty v-else style="height: auto; margin-top: 4rem;">
                    {{ $t('INVENTORY.CLOUD_SERVICE.PAGE.NO_SELECTED') }}
                </p-empty>
                <project-tree-modal :visible.sync="changeProjectState.visible"
                                    :project-id="changeProjectState.projectId"
                                    :loading="changeProjectState.loading"
                                    @confirm="changeProject"
                />
                <s-collect-modal :visible.sync="tableState.collectModalVisible"
                                 :resources="tableState.selectedItems"
                                 id-key="cloud_service_id"
                />
            </template>
        </template>
    </vertical-page-layout>
</template>

<script lang="ts">
/* eslint-disable camelcase */
import { get, find, some } from 'lodash';

import {
    reactive, computed, getCurrentInstance, ComponentRenderProxy,
} from '@vue/composition-api';

import {
    PHorizontalLayout, PDropdownMenuBtn, PTab, PDynamicLayout,
    PPageTitle, PLazyImg, PBreadcrumbs, PIconTextButton, PEmpty, PDivider,
} from '@spaceone/design-system';
import { MenuItem } from '@spaceone/design-system/dist/src/inputs/context-menu/type';
import {
    QuerySearchTableFetchOptions, QuerySearchTableListeners, QuerySearchTableTypeOptions,
} from '@spaceone/design-system/dist/src/data-display/dynamic/dynamic-layout/templates/query-search-table/type';
import { DynamicLayoutFieldHandler } from '@spaceone/design-system/dist/src/data-display/dynamic/dynamic-layout/type';
import { DynamicLayout } from '@spaceone/design-system/dist/src/data-display/dynamic/dynamic-layout/type/layout-schema';

import ServerMain from '@/views/inventory/server/modules/ServerMain.vue';
import VerticalPageLayout from '@/common/components/layouts/VerticalPageLayout.vue';
import ProjectTreeModal from '@/common/modules/ProjectTreeModal.vue';
import Monitoring from '@/common/modules/monitoring/Monitoring.vue';
import CloudServiceDetail from '@/views/inventory/cloud-service/modules/CloudServiceDetail.vue';
import CloudServiceAdmin from '@/views/inventory/cloud-service/modules/CloudServiceAdmin.vue';
import CloudServiceHistory from '@/views/inventory/cloud-service/modules/CloudServiceHistory.vue';
import SCollectModal from '@/common/modules/collect-modal/CollectModal.vue';
import TagsPanel from '@/common/modules/tags-panel/TagsPanel.vue';
import { MonitoringProps, MonitoringResourceType } from '@/common/modules/monitoring/type';
import { ProjectItemResp } from '@/views/project/project/type';

import { replaceUrlQuery } from '@/lib/router-query-string';
import { makeQuerySearchPropsWithSearchSchema } from '@/lib/component-utils/dynamic-layout';
import { SpaceConnector } from '@/lib/space-connector';
import { ApiQueryHelper } from '@/lib/space-connector/helper';
import { referenceFieldFormatter } from '@/lib/reference/referenceFieldFormatter';
import { showErrorMessage, showSuccessMessage } from '@/lib/util';
import { Reference } from '@/lib/reference/type';
import { store } from '@/store';
import config from '@/lib/config';
import { QueryHelper } from '@/lib/query';

const DEFAULT_PAGE_SIZE = 15;

// TODO: move this code to store
const STORAGE_PREFIX = 'inventory/cloudService';
const cloudServiceStore = {
    getItem<T>(name: string, type = 'string'): T {
        const res = localStorage.getItem(`${STORAGE_PREFIX}/${name}`);
        switch (type) {
        case 'number': {
            if (res) return Number(res) as unknown as T;
            return undefined as unknown as T;
        }
        case 'object': {
            try {
                if (res) return JSON.parse(res) as unknown as T;
            } catch (e) {}
            return undefined as unknown as T;
        }
        default: return (res || undefined) as unknown as T;
        }
    },

    setItem(name: string, data: any, type = 'string') {
        let res;
        switch (type) {
        case 'number': {
            res = Number(data);
            break;
        }
        case 'object': {
            try {
                res = JSON.stringify(data);
            } catch (e) {}
            break;
        }
        default: {
            res = data;
            break;
        }
        }
        localStorage.setItem(`${STORAGE_PREFIX}/${name}`, res);
    },
};

interface SidebarItemType {
    id?: string;
    name: string;
    type?: string;
}

export default {
    name: 'CloudServicePage',
    components: {
        ServerMain,
        PLazyImg,
        PDivider,
        VerticalPageLayout,
        CloudServiceDetail,
        CloudServiceHistory,
        CloudServiceAdmin,
        PDynamicLayout,
        PHorizontalLayout,
        PBreadcrumbs,
        PPageTitle,
        PIconTextButton,
        PTab,
        TagsPanel,
        PDropdownMenuBtn,
        PEmpty,
        ProjectTreeModal,
        SCollectModal,
        Monitoring,
    },
    props: {
        provider: {
            type: String,
            required: true,
        },
        group: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
    },
    setup(props, { root }) {
        const vm = getCurrentInstance() as ComponentRenderProxy;
        const queryHelper = new QueryHelper().setFiltersAsRawQueryString(vm.$route.query.filters);

        /** Breadcrumb */
        const routeState = reactive({
            route: computed(() => ([
                { name: vm.$t('MENU.INVENTORY.INVENTORY'), path: '/inventory' },
                { name: vm.$t('MENU.INVENTORY.CLOUD_SERVICE'), path: '/inventory/cloud-service' },
                { name: `${props.group}`, path: `/inventory/cloud-service/${props.provider}/${props.group}/${props.name}` },
                { name: `${props.name}` },
            ])),
        });

        /** Sidebar */
        const sidebarState = reactive({
            items: [] as SidebarItemType[],
            group: '',
            iconUrl: '',
            selectedItem: {} as SidebarItemType,
            hasServer: computed(() => some(sidebarState.items, { type: 'inventory.Server' })),
            serverCloudServiceType: computed(() => find(sidebarState.items, { type: 'inventory.Server' })?.name),
        });

        /** Main Table */
        const fetchOptionState = reactive<Partial<QuerySearchTableFetchOptions>>({
            pageStart: 1,
            pageLimit: cloudServiceStore.getItem<number>('pageLimit', 'number') || DEFAULT_PAGE_SIZE,
            sortDesc: true,
            sortBy: 'created_at',
            queryTags: [],
        });

        const typeOptionState = reactive<Partial<QuerySearchTableTypeOptions>>({
            loading: true,
            totalCount: 0,
            timezone: computed(() => store.state.user.timezone || 'UTC'),
            selectIndex: [],
            selectable: true,
            keyItemSets: [],
            valueHandlerMap: {},
            colCopy: false,
        });

        const tableState = reactive({
            schema: null as null|DynamicLayout,
            items: [],
            selectedItems: computed(() => typeOptionState.selectIndex.map((d, i) => tableState.items[d])),
            consoleLink: computed(() => get(tableState.selectedItems[0], 'reference.external_link')),
            dropdown: computed(() => ([
                {
                    type: 'item',
                    name: 'delete',
                    label: vm.$t('INVENTORY.CLOUD_SERVICE.PAGE.DELETE'),
                    disabled: true,
                },
                { type: 'divider' },
                {
                    type: 'item',
                    name: 'project',
                    label: vm.$t('INVENTORY.CLOUD_SERVICE.PAGE.CHANGE_PROJECT'),
                    disabled: tableState.selectedItems.length === 0,
                },
                { type: 'divider' },
                {
                    name: 'link',
                    label: vm.$t('INVENTORY.CLOUD_SERVICE.PAGE.CONSOLE'),
                    type: 'item',
                    disabled: !tableState.consoleLink || tableState.selectedItems.length > 1,
                    link: tableState.consoleLink,
                    target: 'blank',
                },
            ] as MenuItem[])),
            collectModalVisible: false,
            multiSchema: computed<null|DynamicLayout>(() => {
                if (!tableState.schema) return null;

                const res: DynamicLayout = { ...tableState.schema };
                if (tableState.schema.options.fields) {
                    res.options = {
                        ...tableState.schema.options,
                        fields: [{ name: 'ID', key: 'cloud_service_id' }, ...tableState.schema.options.fields],
                    };
                }

                return res;
            }),
            selectedCloudServiceIds: computed(() => tableState.selectedItems.map(d => d.cloud_service_id)),
            tableHeight: cloudServiceStore.getItem('tableHeight', 'number'),
        });

        const onTableHeightChange = (height) => {
            tableState.tableHeight = height;
            cloudServiceStore.setItem('tableHeight', height, 'number');
        };

        const onSelect: QuerySearchTableListeners['select'] = (selectIndex) => {
            typeOptionState.selectIndex = selectIndex;
        };


        const schemaQueryHelper = new QueryHelper();
        const getTableSchema = async (): Promise<null|DynamicLayout> => {
            try {
                const schema = await SpaceConnector.client.addOns.pageSchema.get({
                    resource_type: 'inventory.CloudService',
                    schema: 'table',
                    options: {
                        provider: props.provider,
                        cloud_service_group: props.group,
                        cloud_service_type: props.name,
                    },
                });

                schemaQueryHelper.setFilters([
                    { k: 'provider', o: '=', v: props.provider },
                    { k: 'cloud_service_group', o: '=', v: props.group },
                    { k: 'cloud_service_type', o: '=', v: props.name },
                ]);

                // declare keyItemSets and valueHandlerMap with search schema
                if (schema?.options?.search) {
                    const searchProps = makeQuerySearchPropsWithSearchSchema(schema.options.search, 'inventory.CloudService', schemaQueryHelper.apiQuery.filter);
                    typeOptionState.keyItemSets = searchProps.keyItemSets;
                    typeOptionState.valueHandlerMap = searchProps.valueHandlerMap;
                }

                // initiate queryTags with keyItemSets
                fetchOptionState.queryTags = queryHelper.setKeyItemSets(typeOptionState.keyItemSets).queryTags;

                // return schema
                return schema;
            } catch (e) {
                console.error(e);
                return null;
            }
        };

        const apiQuery = new ApiQueryHelper();
        const getQuery = (schema?) => {
            apiQuery.setSort(fetchOptionState.sortBy, fetchOptionState.sortDesc)
                .setPage(fetchOptionState.pageStart, fetchOptionState.pageLimit)
                .setFilters(queryHelper.filters)
                .addFilter(
                    { k: 'provider', o: '=', v: props.provider },
                    { k: 'cloud_service_group', o: '=', v: props.group },
                    { k: 'cloud_service_type', o: '=', v: props.name },
                );

            const fields = schema?.options?.fields || tableState.schema?.options?.fields;
            if (fields) {
                apiQuery.setOnly(...fields.map((d) => {
                    if ((d.key as string).endsWith('.seconds')) return (d.key as string).replace('.seconds', '');
                    return d.key;
                }), 'reference', 'cloud_service_id');
            }

            return apiQuery.data;
        };

        const cloudServiceListApi = SpaceConnector.client.inventory.cloudService.list;
        const getCloudServiceTableData = async (schema?): Promise<{items: any[]; totalCount: number}> => {
            typeOptionState.loading = true;
            try {
                const res = await cloudServiceListApi({ query: getQuery(schema) });

                // filtering select index
                typeOptionState.selectIndex = typeOptionState.selectIndex.filter(d => !!res.results[d]);

                return { items: res.results, totalCount: res.total_count };
            } catch (e) {
                console.error(e);
                return { items: [], totalCount: 0 };
            } finally {
                typeOptionState.loading = false;
            }
        };

        const fetchTableData: QuerySearchTableListeners['fetch'|'init'] = async (options, changed?: Partial<QuerySearchTableFetchOptions>) => {
            if (changed) {
                if (changed.sortBy !== undefined) {
                    fetchOptionState.sortBy = changed.sortBy;
                    fetchOptionState.sortDesc = !!changed.sortDesc;
                }
                if (changed.pageLimit !== undefined) {
                    fetchOptionState.pageLimit = changed.pageLimit;
                    cloudServiceStore.setItem('pageLimit', changed.pageLimit);
                }
                if (changed.pageStart !== undefined) {
                    fetchOptionState.pageStart = changed.pageStart;
                }
                if (changed.queryTags !== undefined) {
                    fetchOptionState.queryTags = changed.queryTags;
                    /* api query setting */
                    queryHelper.setFiltersAsQueryTag(changed.queryTags);
                    /* sync updated query tags to url query string */
                    replaceUrlQuery('filters', queryHelper.rawQueryStrings);
                }
            } else {
                // init
                fetchOptionState.queryTags = options.queryTags;
            }

            const { items, totalCount } = await getCloudServiceTableData();
            tableState.items = items;
            typeOptionState.totalCount = totalCount;
        };

        const exportApi = SpaceConnector.client.addOns.excel.export;
        const exportCloudServiceData = async () => {
            try {
                const res = await exportApi({
                    source: {
                        url: '/inventory/cloud-service/list',
                        param: { query: getQuery() },
                    },
                    template: {
                        options: {
                            fileType: 'xlsx',
                            timezone: typeOptionState.timezone,
                        },
                        data_source: tableState.schema.options.fields,
                    },
                });
                window.open(config.get('VUE_APP_API.ENDPOINT') + res.file_link);
            } catch (e) {
                console.error(e);
            }
        };

        const fieldHandler: DynamicLayoutFieldHandler<Record<'reference', Reference>> = (field) => {
            if (field.extraData?.reference) {
                return referenceFieldFormatter(field.extraData.reference, field.data);
            }
            return {};
        };

        const cloudServiceTypeQuery = new ApiQueryHelper()
            .setOnly('cloud_service_type_id', 'name', 'group', 'provider', 'tags', 'is_primary', 'resource_type')
            .setSort('is_primary', true);

        const getCloudServiceTypeQuery = () => {
            cloudServiceTypeQuery.setFilters([
                { k: 'provider', v: props.provider, o: '=' },
                { k: 'group', v: props.group, o: '=' },
            ]);
            return cloudServiceTypeQuery.data;
        };

        const listCloudServiceTypeData = async () => {
            try {
                const res = await SpaceConnector.client.inventory.cloudServiceType.list({
                    query: getCloudServiceTypeQuery(),
                });
                sidebarState.items = res.results.map(d => ({
                    id: d.cloud_service_type_id,
                    name: d.name,
                    type: d.resource_type,
                }));
                sidebarState.iconUrl = res.results[0].tags.find(tag => tag.key === 'spaceone:icon').value;
                sidebarState.group = res.results[0].group;
            } catch (e) {
                console.error(e);
            }
        };

        const onClickSidebarItem = async (item) => {
            if (sidebarState.selectedItem.name !== item.name) {
                await vm.$router.replace({
                    name: 'cloudServicePage',
                    params: {
                        provider: props.provider,
                        group: props.group,
                        name: item.name,
                    },
                    query: vm.$route.query,
                });

                sidebarState.selectedItem = item;

                if (item.type !== 'inventory.Server') {
                    typeOptionState.loading = true;
                    const schema = await getTableSchema();
                    const { items, totalCount } = await getCloudServiceTableData(schema);
                    tableState.schema = schema;
                    tableState.items = items;
                    typeOptionState.totalCount = totalCount;
                }
            }
        };

        /** Change Project */
        const changeProjectState = reactive({
            visible: false,
            loading: false,
            projectId: computed(() => {
                if (tableState.selectedItems.length > 1) return '';
                return get(tableState.selectedItems[0], 'project_id', '');
            }),
        });
        const clickProject = () => { changeProjectState.visible = true; };
        const changeProject = async (data?: ProjectItemResp|null) => {
            changeProjectState.loading = true;

            const api = SpaceConnector.client.inventory.cloudService.changeProject;
            const params: any = {
                cloud_services: tableState.selectedCloudServiceIds,
            };

            if (data) {
                try {
                    params.project_id = data.id;
                    await api(params);
                    showSuccessMessage(vm.$t('INVENTORY.CLOUD_SERVICE.PAGE.ALT_S_CHANGE_PROJECT'), '', root);
                } catch (e) {
                    showErrorMessage(vm.$t('INVENTORY.CLOUD_SERVICE.PAGE.ALT_E_CHANGE_PROJECT'), e, root);
                } finally {
                    await store.dispatch('resource/project/load');
                    const { items, totalCount } = await getCloudServiceTableData();
                    tableState.items = items;
                    typeOptionState.totalCount = totalCount;
                }
            } else {
                try {
                    params.release_project = true;
                    await api(params);
                    showSuccessMessage(vm.$t('INVENTORY.CLOUD_SERVICE.PAGE.ALT_S_RELEASE_PROJECT_TITLE'), '', root);
                } catch (e) {
                    showErrorMessage(vm.$t('INVENTORY.CLOUD_SERVICE.PAGE.ALT_E_RELEASE_PROJECT_TITLE'), e, root);
                } finally {
                    const { items, totalCount } = await getCloudServiceTableData();
                    tableState.items = items;
                    typeOptionState.totalCount = totalCount;
                }
            }
            changeProjectState.loading = false;
            changeProjectState.visible = false;
        };


        /** Tabs */
        const singleItemTabState = reactive({
            tabs: computed(() => ([
                { name: 'detail', label: vm.$t('INVENTORY.CLOUD_SERVICE.PAGE.TAB_DETAILS') },
                { name: 'tag', label: vm.$t('INVENTORY.CLOUD_SERVICE.PAGE.TAB_TAG') },
                { name: 'member', label: vm.$t('INVENTORY.CLOUD_SERVICE.PAGE.TAB_MEMBER') },
                { name: 'history', label: vm.$t('INVENTORY.CLOUD_SERVICE.PAGE.TAB_HISTORY') },
                { name: 'monitoring', label: vm.$t('INVENTORY.CLOUD_SERVICE.PAGE.TAB_MONITORING') },
            ])),
            activeTab: 'detail',
        });

        const multiItemTabState = reactive({
            tabs: computed(() => ([
                { name: 'data', label: vm.$t('INVENTORY.CLOUD_SERVICE.PAGE.TAB_SELECTED_DATA') },
                { name: 'member', label: vm.$t('INVENTORY.CLOUD_SERVICE.PAGE.TAB_MEMBER') },
                { name: 'monitoring', label: vm.$t('INVENTORY.CLOUD_SERVICE.PAGE.TAB_MONITORING') },
            ])),
            activeTab: 'data',
        });

        /** Actions */
        const clickCollectData = () => {
            tableState.collectModalVisible = true;
        };


        /** Monitoring Tab */
        const monitoringState: MonitoringProps = reactive({
            resourceType: 'inventory.CloudService',
            resources: computed(() => tableState.selectedItems.map(d => ({
                id: get(d, 'cloud_service_id'),
                name: d.name,
            }))) as unknown as MonitoringResourceType[],
        });


        /** ******* Page Init ******* */
        const initSidebar = async () => {
            await listCloudServiceTypeData();
            sidebarState.selectedItem = find(sidebarState.items, { name: props.name }) || { name: props.name };
        };

        (async () => {
            await store.dispatch('resource/loadAll');
            tableState.schema = await getTableSchema();
            await initSidebar();
        })();
        /** ************************* */


        return {
            /* Breadcrumb */
            routeState,
            /* Sidebar */
            sidebarState,
            /* Main Table */
            tableState,
            fetchOptionState,
            typeOptionState,
            onTableHeightChange,
            onSelect,
            exportCloudServiceData,
            fetchTableData,
            fieldHandler,


            /* Change Project */
            changeProjectState,
            clickProject,
            changeProject,

            /* Tabs */
            singleItemTabState,
            multiItemTabState,

            /* Actions */
            onClickSidebarItem,
            clickCollectData,

            /* Monitoring Tab */
            monitoringState,
        };
    },
};

</script>

<style lang="postcss" scoped>
.left-toolbox-item {
    margin-left: 1rem;
    &:last-child {
        flex-grow: 1;
    }
}

.sidebar-title {
    display: flex;
    align-items: center;
    margin-top: 2rem;
    margin-left: 1rem;
    margin-bottom: 0.4375rem;
    .sidebar-title-text {
        @apply font-bold;
        font-size: 0.875rem;
        line-height: 140%;
        margin-left: 0.5rem;
    }
}
.sidebar-divider {
    @apply w-full;
    margin-bottom: 0.75rem;
}

.sidebar-list-item {
    @apply truncate;
    height: 2rem;
    margin: 0 0.75rem;
    padding: 0.375rem 1rem;
    border-radius: 0.125rem;
    font-size: 0.875rem;
    line-height: 140%;
    &:hover {
        @apply bg-blue-100 cursor-pointer;
    }
    &:active {
        @apply bg-blue-200 text-blue-500 cursor-pointer;
    }
    &.selected {
        @apply bg-blue-200 text-blue-500 cursor-pointer;
    }
}

.selected-data-tab {
    @apply mt-8;
}

>>> .p-dynamic-layout-query-search-table .p-query-search-table {
    border-width: 1px;
}
</style>
