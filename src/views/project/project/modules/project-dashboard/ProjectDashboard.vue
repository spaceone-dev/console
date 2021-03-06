<template>
    <div class="grid grid-cols-12 project-dashboard">
        <project-all-summary class="col-span-12" :project-id="projectId" />
        <div class="col-span-12 lg:col-span-9 grid grid-cols-12 left-part">
            <project-billing class="col-span-12" :project-id="projectId" />
            <project-personal-health-dashboard class="col-span-12" :providers="providers" :project-id="projectId" />
            <project-service-accounts class="col-span-12 service-accounts-table" :project-id="projectId" />
        </div>
        <div class="col-span-12 lg:col-span-3 grid grid-cols-12 right-part">
            <daily-updates class="col-span-12 daily-updates"
                           :project-id="projectId"
                           :project-filter="projectFilter"
            />
            <cloud-services class="col-span-12 cloud-services"
                            :more-info="true"
                            :project-filter="projectFilter"
                            :project-id="projectId"
            />
            <project-trusted-advisor class="col-span-12 trusted-advisor"
                                     :providers="providers"
                                     :project-id="projectId"
            />
        </div>
    </div>
</template>

<script lang="ts">
import {
    ComponentRenderProxy, computed, getCurrentInstance, reactive, toRefs,
} from '@vue/composition-api';

import CloudServices from '@/common/modules/CloudServices.vue';
import DailyUpdates from '@/common/modules/DailyUpdates.vue';
import ProjectPersonalHealthDashboard from '@/views/project/project/modules/project-dashboard/ProjectPersonalHealthDashboard.vue';
import ProjectAllSummary from '@/views/project/project/modules/project-dashboard/ProjectAllSummary.vue';
import ProjectBilling from '@/views/project/project/modules/project-dashboard/ProjectBilling.vue';
import ProjectServiceAccounts from '@/views/project/project/modules/project-dashboard/ProjectServiceAccounts.vue';
import ProjectTrustedAdvisor from '@/views/project/project/modules/project-dashboard/ProjectTrustedAdvisor.vue';

import { store } from '@/store';


export default {
    name: 'ProjectDashboard',
    components: {
        ProjectBilling,
        ProjectPersonalHealthDashboard,
        ProjectTrustedAdvisor,
        ProjectAllSummary,
        CloudServices,
        DailyUpdates,
        ProjectServiceAccounts,
    },
    props: {
        projectId: {
            type: String,
            default: undefined,
        },
    },
    setup(props) {
        const vm = getCurrentInstance() as ComponentRenderProxy;

        const state = reactive({
            providers: computed(() => vm.$store.state.resource.provider.items),
        });
        const projectFilter = `&filters=project_id%3A%3D${props.projectId}`;

        const init = () => {
            store.dispatch('resource/cloudServiceType/load');
            store.dispatch('resource/region/load');
        };
        init();

        return {
            ...toRefs(state),
            projectFilter,
        };
    },
};
</script>

<style lang="postcss" scoped>
.widget-layout::v-deep {
    .title {
        font-size: 1rem;
        font-weight: bold;
        line-height: 1.6;
    }
}

.project-dashboard {
    grid-gap: 1rem;

    .left-part, .right-part {
        display: grid;
        grid-auto-rows: max-content;
        row-gap: 1rem;
    }

    .cloud-services {
        @apply border border-gray-200;
        min-height: 25rem;
        max-height: 35rem;
        border-radius: 2px;
        @media screen and (width < 1024px) {
            height: 26rem;
        }
    }

    .trusted-advisor {
        @apply border border-gray-200;
        border-radius: 2px;
    }

    .service-accounts-table {
        @apply border border-gray-200;
        border-radius: 2px;
    }

    .daily-updates {
        @apply border border-gray-200;
        max-height: 35rem;
        border-radius: 2px;
    }
}
</style>
