<template>
    <div>
        <p-panel-top :title="$t('IDENTITY.SERVICE_ACCOUNT.MAIN.TAB_CREDENTIALS')" :use-total-count="true" :total-count="totalCount" />
        <p-search-table :fields="fields"
                        :items="items"
                        :loading="loading"
                        :total-count="totalCount"
                        :selectable="false"
                        :excel-visible="false"
                        :style="{height: '100%', border: 'none'}"
                        @init="onChange"
                        @change="onChange"
        >
            <template #col-created_at-format="{value}">
                {{ timestampFormatter(value, timezone) }}
            </template>
        </p-search-table>
    </div>
</template>

<script lang="ts">
import {
    computed, reactive, toRefs, watch,
} from '@vue/composition-api';

import { PPanelTop, PSearchTable } from '@spaceone/design-system';
import { Options, SearchTableListeners } from '@spaceone/design-system/dist/src/data-display/tables/search-table/type';

import { SpaceConnector } from '@/lib/space-connector';
import { ApiQueryHelper } from '@/lib/space-connector/helper';
import { getPageStart } from '@/lib/component-utils/pagination';
import { timestampFormatter } from '@/lib/util';
import { store } from '@/store';

export default {
    name: 'ServiceAccountCredentials',
    components: {
        PSearchTable,
        PPanelTop,
    },
    props: {
        serviceAccountId: {
            type: String,
            default: '',
        },
    },
    setup(props) {
        const state = reactive({
            timezone: computed(() => store.state.user.timezone),
            fields: [
                { label: 'Secret', name: 'secret_id' },
                { label: 'Name', name: 'name' },
                { label: 'Schema', name: 'schema' },
                {
                    label: 'Created',
                    name: 'created_at',
                    type: 'datetime',
                    options: {
                        source_type: 'timestamp',
                        source_format: 'seconds',
                    },
                },
            ],
            items: [],
            loading: true,
            totalCount: 0,
            options: {} as Options,
        });

        const apiQuery = new ApiQueryHelper();
        const getQuery = () => apiQuery.setFilters([{
            k: 'service_account_id',
            v: props.serviceAccountId,
            o: '=',
        }, { v: state.options.searchText }])
            .setSort(state.options.sortBy, state.options.sortDesc)
            .setPage(
                getPageStart(state.options.thisPage, state.options.pageSize),
                state.options.pageSize,
            )
            .setOnly('secret_id', 'name', 'schema', 'created_at')
            .data;

        const api = SpaceConnector.client.secret.secret.list;

        const listCredentials = async () => {
            state.loading = true;
            try {
                const res = await api({ query: getQuery() });
                state.items = res.results;
                state.totalCount = res.total_count;
            } catch (e) {
                console.error(e);
            } finally {
                state.loading = false;
            }
        };

        const onChange: SearchTableListeners['change'] = async (options) => {
            state.options = options;
            await listCredentials();
        };

        watch(() => props.serviceAccountId, (after, before) => {
            if (after !== before) listCredentials();
        }, { immediate: true });

        return {
            ...toRefs(state),
            timestampFormatter,
            onChange,
        };
    },
};
</script>

<style lang="postcss" scoped>

</style>
