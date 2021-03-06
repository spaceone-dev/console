<template>
    <section class="spot-group-list-wrapper">
        <p-breadcrumbs :routes="routeState.route" />
        <section class="page-title">
            <p-page-title :title="$t('AUTOMATION.SPOT_AUTOMATION.MAIN.SPOT_GROUP')" use-total-count :total-count="totalCount" />
            <router-link :to="{ name: 'addSpotGroup' }">
                <p-icon-text-button style-type="primary-dark" outline name="ic_plus_bold"
                                    class="add-spot-group-btn"
                >
                    {{ $t('AUTOMATION.SPOT_AUTOMATION.SPOT_GROUP_LIST.ADD_SPOT_GROUP') }}
                </p-icon-text-button>
            </router-link>
        </section>
        <p-divider class="spot-group-divider" />
        <p-toolbox filters-visible
                   search-type="query"
                   :page-size.sync="pageSize"
                   :total-count="totalCount"
                   :query-tags="tags"
                   :key-item-sets="keyItemSets"
                   :value-handler-map="valueHandlerMap"
                   @change="onChange"
                   @refresh="onChange"
        />
        <p-i name="ic_list" width="1.5rem" height="1.5rem"
             color="inherit transparent"
             @click="showListView"
        />
        <p-i name="ic_card-list" width="1.5rem" height="1.5rem"
             color="inherit transparent"
             @click="showCardView"
        />
        <p-data-loader class="flex-grow" :data="items" :loading="loading" :class="{'short': isShort}">
            <div class="card-wrapper" :class="{'short': isShort}">
                <div v-for="item in items" :key="item.spot_group_id" class="spot-group-card">
                    <spot-group-card :card-data="item"
                                     :is-short="isShort"
                    />
                </div>
            </div>
        </p-data-loader>
    </section>
</template>

<script lang="ts">
import {
    ComponentRenderProxy, computed, getCurrentInstance, reactive, toRefs,
} from '@vue/composition-api';
import {
    PBreadcrumbs, PPageTitle, PDivider, PToolbox, PIconTextButton, PDataLoader, PI,
} from '@spaceone/design-system';
import { makeQuerySearchPropsWithSearchSchema } from '@/lib/component-utils/dynamic-layout';
import { QueryHelper } from '@/lib/query';
import { timestampFormatter } from '@/lib/util';
import { replaceUrlQuery } from '@/lib/router-query-string';
import { getPageStart, getThisPage } from '@/lib/component-utils/pagination';
import SpotGroupCard from '@/views/automation/spot-automation/modules/spot-group-card/SpotGroupCard.vue';
import { SpaceConnector } from '@/lib/space-connector';
import { ApiQueryHelper } from '@/lib/space-connector/helper';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import { store } from '@/store';

dayjs.extend(timezone);

// TODO: change handlers with spot automation spec
const handlers = makeQuerySearchPropsWithSearchSchema(
    [{
        title: 'Filters',
        items: [
            { key: 'cloud_service_id', name: 'Cloud Service ID', reference: 'inventory.CloudService' },
            { key: 'provider', name: 'Provider', reference: 'identity.Provider' },
            { key: 'project_id', name: 'Project', reference: 'identity.Project' },
        ],
    }],
    'inventory.CloudService',
);

export default {
    name: 'SpotGroupPage',
    components: {
        SpotGroupCard,
        PBreadcrumbs,
        PPageTitle,
        PDivider,
        PToolbox,
        PIconTextButton,
        PDataLoader,
        PI,
    },
    setup() {
        const vm = getCurrentInstance() as ComponentRenderProxy;
        const queryHelper = new QueryHelper().setFiltersAsRawQueryString(vm.$route.query.filters);
        const apiQuery = new ApiQueryHelper();

        const state = reactive({
            items: undefined as any,
            loading: true,
            keyItemSets: handlers.keyItemSets,
            valueHandlerMap: handlers.valueHandlerMap,
            tags: queryHelper.setKeyItemSets(handlers.keyItemSets).queryTags,
            thisPage: 1,
            pageSize: 24,
            sortBy: null,
            sortDesc: true,
            totalCount: 0,
            timezone: computed(() => store.state.user.timezone),
            isShort: false,
        });
        const routeState = reactive({
            route: computed(() => [
                { name: vm.$t('MENU.AUTOMATION.AUTOMATION'), path: '/automation' },
                { name: vm.$t('MENU.AUTOMATION.SPOT_AUTOMATION') },
            ]),
        });

        const getQuery = () => {
            apiQuery.setPageStart(getPageStart(state.thisPage, state.pageSize))
                .setPageLimit(state.pageSize)
                .setFilters(queryHelper.filters);

            return apiQuery.data;
        };

        const listSpotGroup = async () => {
            state.loading = true;
            try {
                const res = await SpaceConnector.client.spotAutomation.spotGroup.list({ query: getQuery() });
                state.items = res.results.map(d => ({
                    ...d,
                    created_at: timestampFormatter(d.created_at, state.timezone),
                }));
                // state.items = [{ name: '1', created_at: '111', spot_group_id: 1 }, { name: '2', created_at: '222', spot_group_id: 2 }];
                state.totalCount = res.total_count || 0;
                state.loading = false;
            } catch (e) {
                console.error(e);
            }
        };


        const showListView = () => {
            state.isShort = false;
        };

        const showCardView = () => {
            state.isShort = true;
        };

        const changeQueryString = async (options) => {
            queryHelper.setFiltersAsQueryTag(options.queryTags);
            await replaceUrlQuery('filters', queryHelper.rawQueryStrings);
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
            await listSpotGroup();
        };
        (async () => {
            await listSpotGroup();
        })();


        return {
            ...toRefs(state),
            routeState,
            onChange,
            timestampFormatter,
            showListView,
            showCardView,
        };
    },
};
</script>

<style lang="postcss" scoped>
.spot-group-list-wrapper {
    padding: 2rem 1.5rem;
}
.page-title {
    display: flex;
    justify-content: space-between;
}

.spot-group-divider {
    @apply w-full;
    margin-bottom: 1.5rem;
}
.card-wrapper {
    &.short {
        @apply grid;
        grid-template-columns: repeat(auto-fit, minmax(259px, 1fr));
        row-gap: 1.5rem;
        column-gap: 1.5rem;
        max-width: 716px;

        @screen md {
            grid-template-columns: repeat(auto-fit, minmax(460px, 1fr));
        }

        @screen lg {
            grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
        }
    }
}

.spot-group-card {
    margin-top: 1.5rem;
}
</style>
