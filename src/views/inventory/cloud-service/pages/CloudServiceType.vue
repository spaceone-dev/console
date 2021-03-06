<template>
    <p-vertical-page-layout :min-width="260" :init-width="260" :max-width="400">
        <template #sidebar="{width}">
            <div :style="{width}">
                <p class="sidebar-title">
                    {{ $t('INVENTORY.CLOUD_SERVICE.MAIN.FAVORITES') }} <span class="count">({{ favoriteItems.length }})</span>
                </p>
                <p-divider class="sidebar-divider" />
                <favorite-list :items="favoriteItems" class="favorite-list" @delete="onFavoriteDelete">
                    <template #icon="{item}">
                        <p-lazy-img :src="item.icon || ''"
                                    error-icon="ic_provider_other"
                                    :alt="item.name" width="1rem" height="1rem"
                                    class="icon"
                        />
                    </template>
                </favorite-list>

                <p class="sidebar-title">
                    {{ $t('INVENTORY.CLOUD_SERVICE.MAIN.SERVICE_PROVIDER') }}
                </p>
                <p-divider class="sidebar-divider" />
                <div v-for="provider in providerState.items" :key="provider.provider" class="provider-list">
                    <p-divider v-if="provider.provider && provider.provider !== 'all'" class="provider-divider" />
                    <p-radio v-model="selectedProvider" :value="provider.provider">
                        <template #radio-left>
                            <img v-if="provider.icon"
                                 :src="provider.icon"
                                 :alt="provider.provider"
                                 class="provider-icon"
                            >
                            <p-i v-else name="ic_provider_other"
                                 class="provider-icon"
                            />
                            <span class="provider-name">{{ provider.name }}</span>
                        </template>
                        <template #icon="{ iconName }">
                            <p-i class="radio-icon float-right" width="1.25rem" height="1.25rem"
                                 :name="iconName"
                            />
                        </template>
                    </p-radio>
                </div>
                <p class="sidebar-title">
                    {{ $t('INVENTORY.CLOUD_SERVICE.MAIN.SERVICE_CATEGORY') }}
                </p>
                <p-divider class="sidebar-divider" />
                <div v-for="(checked, service) in filterState.serviceCategories" :key="service"
                     :class="{selected: checked}"
                     class="service-categories"
                >
                    <p-check-box :selected="filterState.serviceFilter" :value="service"
                                 @change="onClickService(service, ...arguments)"
                    >
                        <span class="service">{{ service }}</span>
                    </p-check-box>
                </div>
                <p id="region-title">
                    {{ $t('INVENTORY.CLOUD_SERVICE.MAIN.REGION') }}
                </p>
                <p-divider class="sidebar-divider" />
                <div v-if="filterState.regionList.length === 0">
                    <p class="no-region">
                        {{ $t('INVENTORY.CLOUD_SERVICE.MAIN.NO_REGION') }}
                    </p>
                </div>
                <div v-for="(region, idx) in filterState.regionList" :key="idx"
                     class="region-list"
                >
                    <p-check-box :selected="filterState.regionFilter" :value="region.region_code"
                                 @change="onClickRegion"
                    />
                    <span class="region-list-text">
                        <div class="region-type">
                            <span class="region-provider"
                                  :style="{color: providers[region.provider] ? providers[region.provider].color : undefined}"
                            >
                                {{ providers[region.provider] ? providers[region.provider].label : region.provider }}
                            </span>
                            {{ region.name }}
                        </div>
                        <span class="region-code">{{ region.region_code }} </span>
                    </span>
                </div>
            </div>
        </template>
        <template #default>
            <div class="page-wrapper">
                <div class="page-navigation">
                    <p-breadcrumbs :routes="route" />
                </div>
                <p-page-title :title="selectedProviderName" use-total-count :total-count="totalCount"
                              class="page-title"
                />
                <p-divider class="cloud-service-divider" />
                <p-toolbox filters-visible
                           search-type="query"
                           :page-size.sync="pageSize"
                           :total-count="totalCount"
                           :query-tags="tags"
                           :key-item-sets="keyItemSets"
                           :value-handler-map="valueHandlerMap"
                           @change="onChange"
                           @refresh="onChange"
                >
                    <template #left-area>
                        <p-check-box v-model="filterState.isPrimary">
                            <span class="show-all">{{ $t('INVENTORY.CLOUD_SERVICE.MAIN.SHOW_MAJOR') }}</span>
                        </p-check-box>
                    </template>
                </p-toolbox>
                <p-data-loader class="flex-grow" :data="items" :loading="loading">
                    <div class="cloud-service-type-wrapper">
                        <div v-for="(item, i) in items" :key="i" class="cloud-service-type-item">
                            <router-link :to="getToCloudService(item)"
                                         class="item-wrapper"
                            >
                                <p-lazy-img width="3rem" height="3rem"
                                            :src="item.icon || (providers[item.provider] ? providers[item.provider].icon : '')"
                                            error-icon="ic_provider_other"
                                            :alt="item.name"
                                            class="icon"
                                />
                                <div class="text-content">
                                    <div class="title">
                                        {{ item.cloud_service_group }}
                                    </div>
                                    <div class="sub-title">
                                        <span class="sub-title-provider"> {{ providers[item.provider] ? providers[item.provider].label : item.provider }} </span>
                                        <span class="sub-title-name">{{ item.cloud_service_type }}</span>
                                        <span class="sub-title-count">
                                            {{ item.count }}
                                        </span>
                                    </div>
                                </div>
                                <favorite-button :item-id="item.cloud_service_type_id || ''"
                                                 favorite-type="cloudServiceType"
                                                 resource-type="inventory.CloudServiceType"
                                                 class="favorite-btn"
                                />
                            </router-link>
                        </div>
                    </div>
                    <template #no-data>
                        <div class="text-center empty-cloud-service">
                            <img class="empty-cloud-service-img" src="@/assets/images/illust_satellite.svg">
                            <p class="text-primary2 mb-12">
                                {{ $t('INVENTORY.CLOUD_SERVICE.MAIN.EMPTY_CLOUD_SERVICE') }}
                            </p>
                            <router-link :to="`/identity/service-account/?provider=${selectedProvider}`">
                                <p-icon-text-button style-type="primary" name="ic_plus_bold"
                                                    class="mx-auto text-center"
                                >
                                    {{ $t('INVENTORY.CLOUD_SERVICE.MAIN.ADD_SERVICE_ACCOUNT') }}
                                </p-icon-text-button>
                            </router-link>
                        </div>
                    </template>
                </p-data-loader>

                <div class="pagination">
                    <p-pagination :total-count="totalCount"
                                  :this-page.sync="thisPage"
                                  :page-size.sync="pageSize"
                                  @change="onPaginationChange"
                    />
                </div>
            </div>
        </template>
    </p-vertical-page-layout>
</template>

<script lang="ts">
/* eslint-disable camelcase */
import { Location } from 'vue-router';
import {
    zipObject, debounce, range, sortBy, forEach,
} from 'lodash';
import axios, { CancelTokenSource } from 'axios';

import {
    ComponentRenderProxy, Ref,
    computed, reactive, ref, toRefs, watch,
    getCurrentInstance,
} from '@vue/composition-api';

import {
    PPageTitle, PPagination, PLazyImg, PCheckBox,
    PIconTextButton, PBreadcrumbs, PRadio, PI, PDivider, PToolbox, PDataLoader,
} from '@spaceone/design-system';

import PVerticalPageLayout from '@/common/components/layouts/VerticalPageLayout.vue';

import { makeQuerySearchPropsWithSearchSchema } from '@/lib/component-utils/dynamic-layout';
import { getPageStart, getThisPage } from '@/lib/component-utils/pagination';
import { SpaceConnector } from '@/lib/space-connector';
import { ApiQueryHelper } from '@/lib/space-connector/helper';
import {
    queryStringToStringArray, replaceUrlQuery,
    RouteQueryString,
} from '@/lib/router-query-string';
import { Tags, TimeStamp } from '@/models';
import { store } from '@/store';
import FavoriteList from '@/common/modules/favorite-list/FavoriteList.vue';
import { FavoriteItem } from '@/store/modules/favorite/type';
import FavoriteButton from '@/common/modules/FavoriteButton.vue';
import { QueryHelper } from '@/lib/query';
import { QueryStoreFilter } from '@/lib/query/type';


interface RegionModel extends Tags {
    region_id: string;
    state: string;
    name: string;
    created_at: TimeStamp;
    domain_id: string;
    deleted_at: TimeStamp;
    region_code: string;
    provider: string;
    collection_info: object;
}

export default {
    name: 'CloudServiceType',
    components: {
        FavoriteButton,
        FavoriteList,
        PLazyImg,
        PPagination,
        PDivider,
        PRadio,
        PIconTextButton,
        PVerticalPageLayout,
        PI,
        PPageTitle,
        PBreadcrumbs,
        PCheckBox,
        PToolbox,
        PDataLoader,
    },
    setup(props, context) {
        const vm = getCurrentInstance() as ComponentRenderProxy;
        const queryHelper = new QueryHelper().setFiltersAsRawQueryString(vm.$route.query.filters);

        const selectedProvider: Ref<string> = ref('all');

        const providerState = reactive({
            items: computed(() => [
                {
                    provider: 'all', icon: '', color: '', label: 'All', name: 'All',
                },
                ...Object.keys(store.state.resource.provider.items).map(k => ({
                    provider: k,
                    ...store.state.resource.provider.items[k],
                })),
            ]),
        });
        const selectedProviderName = computed(() => store.state.resource.provider.items[selectedProvider.value]?.name || selectedProvider.value);
        const filterState = reactive({
            serviceCategories: zipObject([
                'Compute', 'Container', 'Database', 'Networking', 'Storage', 'Security', 'Analytics', 'Application Integration', 'Management',
            ], new Array(9).fill(false)),
            serviceFilter: [] as string[],
            regionList: [] as RegionModel[],
            selectedRegionIdx: [] as number[],
            regionFilter: [] as string[],
            isPrimary: true,
        });
        const handlers = makeQuerySearchPropsWithSearchSchema(
            [{
                title: 'Filters',
                items: [
                    { key: 'cloud_service_type', name: 'Cloud Service Type' },
                    { key: 'cloud_service_group', name: 'Cloud Service Group' },
                    { key: 'project_id', name: 'Project', reference: 'identity.Project' },
                    { key: 'collection_info.service_accounts', name: 'Service Account', reference: 'identity.ServiceAccount' },
                    { key: 'collection_info.secrets', name: 'Secret', reference: 'secret.Secret' },
                ],
            }],
            'inventory.CloudService',
        );

        const state = reactive({
            items: undefined as any,
            providerName: 'All',
            loading: true,
            keyItemSets: handlers.keyItemSets,
            valueHandlerMap: handlers.valueHandlerMap,
            tags: queryHelper.setKeyItemSets(handlers.keyItemSets).queryTags,
            thisPage: 1,
            pageSize: 24,
            totalCount: 0,
            providers: computed(() => vm.$store.state.resource.provider.items),
            serviceAccounts: computed(() => vm.$store.state.resource.serviceAccount.items),
            favoriteItems: computed(() => vm.$store.getters['favorite/cloudServiceType/sortedItems']),
        });

        const onFavoriteDelete = (item: FavoriteItem) => {
            vm.$store.dispatch('favorite/cloudServiceType/removeItem', item);
        };

        const regionApiQuery = new ApiQueryHelper().setOnly('region_code', 'provider', 'name');
        const getRegionQuery = (value?: string) => {
            if (value) {
                regionApiQuery.setFilters([{
                    k: 'provider',
                    v: value,
                    o: '=',
                }]);
            } else regionApiQuery.setFilters([]);

            return regionApiQuery.data;
        };

        const listRegionByProvider = async (selectedProviderValue) => {
            try {
                const res = await SpaceConnector.client.inventory.region.list({
                    query: getRegionQuery(selectedProviderValue === 'all' ? undefined : selectedProviderValue),
                });

                // filtering region filter
                const regionMap = zipObject(res.results.map(d => d.region_code), res.results);
                filterState.regionFilter = filterState.regionFilter.filter(d => regionMap[d]);

                filterState.regionList = res.results;
            } catch (e) {
                console.error(e);
            }
        };
        const onClickService = async (region, res, isSelected) => {
            filterState.serviceFilter = res;
        };
        const onClickRegion = async (val, isSelected) => {
            filterState.regionFilter = val;
        };

        /**
         * Card click event
         * */
        const cardQueryHelper = new QueryHelper();
        const getToCloudService = (item) => {
            const searchFilters = queryHelper.filters;
            cardQueryHelper.setFilters(searchFilters.filter((f: any) => f.k && ![
                'cloud_service_type',
                'cloud_service_group',
            ].includes(f.k)));

            if (filterState.regionFilter.length > 0) {
                cardQueryHelper.addFilter({ k: 'region_code', o: '=', v: filterState.regionFilter });
            }

            const res: Location = {
                name: 'cloudServicePage',
                params: {
                    provider: item.provider,
                    group: item.cloud_service_group,
                    name: item.cloud_service_type,
                },
                query: {
                    filters: cardQueryHelper.rawQueryStrings,
                },
            };
            return res;
        };

        const sidebarQueryHelper = new QueryHelper();
        const sidebarFilters = computed<{filters: QueryStoreFilter[]; labels: string[]}>(() => {
            sidebarQueryHelper.setFilters([]);
            if (selectedProvider.value !== 'all') {
                sidebarQueryHelper.addFilter({ k: 'provider', v: selectedProvider.value, o: '=' });
            }
            if (filterState.regionFilter.length > 0) {
                sidebarQueryHelper.addFilter({ k: 'region_code', v: filterState.regionFilter, o: '=' });
            }

            const res = {
                filters: sidebarQueryHelper.filters,
                labels: [] as string[],
            };
            if (filterState.serviceFilter.length > 0) {
                res.labels = filterState.serviceFilter;
            }
            return res;
        });

        const apiQuery = new ApiQueryHelper();
        const getParams = (isTriggeredBySideFilter = false) => {
            const { filters, labels } = sidebarFilters.value;

            apiQuery.setPageLimit(state.pageSize)
                .setFilters(filters)
                .addFilter(...queryHelper.filters)
                .setSort('count', true);

            if (isTriggeredBySideFilter) state.thisPage = 1;
            else apiQuery.setPageStart(getPageStart(state.thisPage, state.pageSize));

            return {
                is_primary: filterState.isPrimary,
                labels,
                query: apiQuery.data,
            };
        };

        // ajax request
        let listCloudServiceRequest: CancelTokenSource | undefined;
        const listCloudServiceType = async (isTriggeredBySideFilter = false) => {
            // if request is already exist, cancel the request
            if (listCloudServiceRequest) {
                listCloudServiceRequest.cancel('Next request has been called.');
                listCloudServiceRequest = undefined;
            }
            // create a new token for upcoming request (overwrite the previous one)
            listCloudServiceRequest = axios.CancelToken.source();
            state.loading = true;
            try {
                const res = await SpaceConnector.client.statistics.topic.cloudServiceResources(
                    getParams(isTriggeredBySideFilter),
                    { cancelToken: listCloudServiceRequest.token },
                );

                state.items = res.results;
                state.totalCount = res.total_count || 0;
                state.loading = false;
                listCloudServiceRequest = undefined;
            } catch (e) {
                if (!axios.isCancel(e.axiosError)) {
                    state.items = [];
                    state.totalCount = 0;
                    state.loading = false;
                } else {
                    console.error(e);
                }
            }
        };

        watch(() => sidebarFilters.value, async (after, before) => {
            if (after !== before) {
                // await listCloudServiceType(after);
                await listCloudServiceType(true);
                await replaceUrlQuery('provider', selectedProvider.value);
                await replaceUrlQuery('region', filterState.regionFilter);
                await replaceUrlQuery('service', filterState.serviceFilter);
            }
        }, { immediate: false });

        watch<boolean, boolean>(() => filterState.isPrimary, async (after, before) => {
            if (after !== before) {
                await listCloudServiceType();
                await replaceUrlQuery('primary', filterState.isPrimary.toString());
            }
        }, { immediate: false });

        const changeQueryString = async (options) => {
            queryHelper.setFiltersAsQueryTag(options.queryTags);
            await replaceUrlQuery('filters', queryHelper.rawQueryStrings);
        };

        const onPaginationChange = async () => {
            await listCloudServiceType();
        };

        const onChange = async (options: any) => {
            if (options.queryTags !== undefined) {
                state.tags = options.queryTags;
                await changeQueryString(options);
            }
            if (options.limit !== undefined) {
                state.pageSize = options.limit;
            }
            if (options.start !== undefined) {
                state.thisPage = getThisPage(options.start, state.pageSize);
            }
            await listCloudServiceType();
        };

        const routeState = reactive({
            route: computed(() => ([
                { name: vm.$t('MENU.INVENTORY.INVENTORY'), path: '/inventory' },
                { name: vm.$t('MENU.INVENTORY.CLOUD_SERVICE') },
            ])),
        });

        const checkProvider = async (queryStringForCheck): Promise<string> => {
            let providerQueryString = queryStringForCheck;
            const providerList = Object.keys(store.state.resource.provider.items);
            if (!providerList.includes(queryStringForCheck)) {
                providerQueryString = 'all';
            }
            return providerQueryString;
        };

        const initProvider = async (): Promise<string> => {
            let queryString: RouteQueryString = vm.$route.query.provider;
            if (Array.isArray(queryString)) queryString = queryString[0];
            if (providerState.items.length > 0) {
                if (queryString) queryString = await checkProvider(queryString);
            }
            return queryString || 'all';
        };

        const initPrimary = async () => {
            let queryString: RouteQueryString = vm.$route.query.primary;
            if (typeof queryString === 'undefined' || !queryString) queryString = 'true';
            return queryString as string;
        };

        /** Init */
        (async () => {
            await Promise.all([
                vm.$store.dispatch('resource/provider/load'),
                vm.$store.dispatch('resource/serviceAccount/load'),
                vm.$store.dispatch('resource/cloudServiceType/load'),
                vm.$store.dispatch('favorite/cloudServiceType/load'),
            ]);

            /* bring values from url */
            const providerQueryString: string = await initProvider();
            const primaryQueryString = await initPrimary();

            /* filter setting */
            selectedProvider.value = providerQueryString;
            filterState.serviceFilter = queryStringToStringArray(vm.$route.query.service);
            filterState.regionFilter = queryStringToStringArray(vm.$route.query.region);
            filterState.isPrimary = JSON.parse(primaryQueryString);


            /* region list init */
            watch<string, boolean>(() => selectedProvider.value, debounce((after) => {
                if (!after) return;
                if (after) {
                    listRegionByProvider(after);
                }
            }, 50), { immediate: true });

            /* cloud service type list init */
            await listCloudServiceType();
        })();


        return {
            filterState,
            selectedProviderName,
            listRegionByProvider,
            onClickService,
            onClickRegion,
            ...toRefs(routeState),
            ...toRefs(state),
            onFavoriteDelete,
            selectedProvider,
            providerState,
            getToCloudService,
            skeletons: range(5),
            onPaginationChange,
            onChange,
        };
    },
};

</script>

<style lang="postcss" scoped>
.sidebar-title {
    @apply text-gray-900 text-sm font-bold;
    align-items: center;
    padding-top: 2rem;
    padding-left: 1rem;
    .count {
        font-weight: normal;
    }
}
.favorite-list {
    @apply px-4;
}
#region-title {
    @apply text-gray-900 text-sm font-bold;
    padding-top: 1.375rem;
    padding-left: 1rem;
}
.sidebar-divider {
    @apply w-full;
    padding-left: 0;
    margin-top: 0.5625rem;
    margin-bottom: 1rem;
}

.provider-list {
    @apply justify-between text-sm;
    padding-left: 1rem;
    padding-right: 1.1875rem;
    line-height: 1.5rem;
    .provider-divider {
        @apply bg-gray-100;
        margin-top: 0.625rem;
        margin-bottom: 0.5625rem;
    }
    .provider-name {
        display: inline-block;
        cursor: pointer;
    }
    .provider-icon {
        @apply inline justify-start;
        width: 1.5rem;
        height: 1.5rem;
        cursor: pointer;
        margin-right: 0.5625rem;
    }
    .provider-radio-btn {
        @apply float-right;
    }
}
.no-region {
    @apply text-gray-400 text-sm;
    padding-left: 1rem;
}
.region-list {
    display: flex;
    padding-left: 1rem;
    width: 100%;
}
.region-list-text {
    @apply text-sm;
    margin-bottom: 0.875rem;
    display: flex;
    flex-direction: column;
    &:hover {
        @apply text-secondary cursor-pointer;
    }
    .region-type {
        padding-left: 0.25rem;
    }
    .region-provider {
        @apply mr-1;
    }
    .region-code {
        @apply text-gray-400;
        padding-left: 0.25rem;
    }
}
.service-categories {
    @apply text-sm;
    margin-left: 1rem;
    padding-bottom: 0.625rem;
    .service {
        padding-left: 0.25rem;
        &:hover {
            @apply text-secondary cursor-pointer;
        }
    }
}

/* right contents */
.page-wrapper {
    @apply flex flex-col w-full h-full;
}
.show-all {
    @apply text-sm mr-2;
    line-height: 2rem;
}
.cloud-service-divider {
    @apply w-full;
    margin-top: 1.5rem;
    margin-bottom: 1.5rem;
}
.cloud-service-type-wrapper {
    @apply grid w-full;
    grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
    gap: 1rem;
}

.cloud-service-type-item {
    @apply px-6 bg-white border border-gray-200;
    height: 6rem;
    filter: drop-shadow(0 2px 4px rgba(theme('colors.black'), 0.06));
    border-radius: 4px;
    .favorite-btn {
        @apply ml-2;
        flex-shrink: 0;
        &:not(.active) {
            display: none;
        }
    }
    &:hover {
        @apply border-l border-secondary bg-blue-100;
        cursor: pointer;
        .favorite-btn:not(.active) {
            display: block;
        }
    }
    .item-wrapper {
        @apply flex w-full h-full items-center;
        .icon {
            @apply overflow-hidden flex-shrink-0;
            border-radius: 4px;
        }
        .text-content {
            @apply ml-4 flex-grow overflow-hidden;
            .title {
                @apply mb-1 w-full truncate;
                font-size: 1rem;
                line-height: 1.2;
            }
            .sub-title {
                @apply w-full flex items-center;
                font-size: 0.875rem;
                line-height: 1.5;

                .sub-title-provider {
                    @apply mr-2 text-gray-400;
                    flex-shrink: 0;
                }

                .sub-title-name {
                    @apply mr-2 inline-block truncate;
                    flex-shrink: 1;
                }

                .sub-title-count {
                    flex-shrink: 0;
                    font-weight: bold;
                }
            }
        }
    }
}

.page-title {
    @apply capitalize;
    margin-bottom: 0;
}
.empty-cloud-service {
    @apply w-full h-full;
    .empty-cloud-service-img {
        @apply w-48 mx-auto pt-19 mb-8;
    }
}
.pagination {
    text-align: center;
    padding-top: 1.5rem;
    bottom: 0;
}
</style>
