<template>
    <general-page-layout class="spot-group-detail-page">
        <div class="page-content">
            <p-breadcrumbs :routes="routeState.routes" />
            <div class="top-wrapper">
                <p-page-title title="Spot Group Name" child @goBack="$router.go(-1)" />
                <div class="button-group">
                    <p-icon-button name="ic_transhcan"
                                   class="delete-button"
                                   @click="openSpotGroupDeleteModal"
                    />
                    <p-icon-button name="ic_edit-text"
                                   class="edit-button"
                                   @click="openSpotGroupEditModal"
                    />
                </div>
            </div>
            <p-tab :tabs="tabState.tabs" :active-tab.sync="tabState.activeTab"
                   class="tab-content"
            >
                <template #summary>
                    <spot-group-detail-dashboard />
                </template>
                <template #instance />
                <template #loadBalancer />
                <template #member />
                <template #tags />
                <template #history />
            </p-tab>
        </div>
    </general-page-layout>
</template>

<script lang="ts">
import {
    PBreadcrumbs, PPageTitle, PIconButton, PTab,
} from '@spaceone/design-system';
import { TabItem } from '@spaceone/design-system/dist/src/navigation/tabs/tab/type';

import {
    ComponentRenderProxy, computed, getCurrentInstance, reactive,
} from '@vue/composition-api';

import GeneralPageLayout from '@/common/components/layouts/GeneralPageLayout.vue';
import SpotGroupDetailDashboard from '@/views/automation/spot-automation/modules/spot-group-detail-dashboard/SpotGroupDetailDashboard.vue';

export default {
    name: 'SpotGroupDetailPage',
    components: {
        SpotGroupDetailDashboard,
        GeneralPageLayout,
        PBreadcrumbs,
        PPageTitle,
        PIconButton,
        PTab,
    },
    setup(props) {
        const vm = getCurrentInstance() as ComponentRenderProxy;
        const tabState = reactive({
            tabs: computed(() => ([
                { name: 'summary', label: vm.$t('AUTOMATION.SPOT_AUTOMATION.DETAIL.TAB_SUMMARY'), keepAlive: true },
                { name: 'instance', label: vm.$t('AUTOMATION.SPOT_AUTOMATION.DETAIL.TAB_INSTANCE') },
                { name: 'loadBalancer', label: vm.$t('AUTOMATION.SPOT_AUTOMATION.DETAIL.TAB_LOAD_BALANCER') },
                { name: 'member', label: vm.$t('AUTOMATION.SPOT_AUTOMATION.DETAIL.TAB_MEMBER') },
                { name: 'tag', label: vm.$t('AUTOMATION.SPOT_AUTOMATION.DETAIL.TAB_TAG') },
                { name: 'history', label: vm.$t('AUTOMATION.SPOT_AUTOMATION.DETAIL.TAB_HISTORY') },
            ] as TabItem[])),
            activeTab: 'summary',
        });
        const routeState = reactive({
            routes: computed(() => ([
                { name: vm.$t('MENU.AUTOMATION.AUTOMATION'), path: '/automation' },
                { name: vm.$t('MENU.AUTOMATION.SPOT_AUTOMATION'), path: '/automation/spot-automation/spot-group' },
                { name: vm.$t('MENU.AUTOMATION.SPOT_GROUP') },
            ])),
        });

        /* event */
        const openSpotGroupDeleteModal = () => {
            console.log('open delete modal');
        };
        const openSpotGroupEditModal = () => {
            console.log('open edit modal');
        };

        return {
            tabState,
            routeState,
            openSpotGroupDeleteModal,
            openSpotGroupEditModal,
        };
    },
};
</script>

<style lang="postcss" scoped>
.spot-group-detail-page {
    .page-inner {
        max-width: 85.5rem;
        margin: 0 auto;
    }
    .p-tab::v-deep {
        border: none;
        margin: auto;

        .p-tab-bar {
            border: none;
        }
        .tab-pane {
            @apply border border-gray-200;
            padding: 0;
        }
    }
    .top-wrapper {
        display: flex;
        margin-bottom: 2rem;
        .p-page-title {
            width: auto;
            margin-bottom: 0;
        }
        .button-group {
            margin-left: 0.75rem;
        }
    }
}
</style>
