<template>
    <general-page-layout class="collector-creator-container">
        <div class="page-navigation">
            <p-breadcrumbs :routes="routes" />
        </div>
        <p-icon-text-button name="ic_back" class="text-2xl mb-6 p-0"
                            icon-color="transparent inherit"
                            width="1.5rem" height="1.5rem"
                            @click="onClickBackButton"
        >
            {{ $t('PLUGIN.COLLECTOR.CREATE.TITLE') }}
        </p-icon-text-button>
        <p-progress-wizard :tabs="tabState.tabs"
                           :active-idx.sync="tabState.activeIdx"
                           :invalid-state="tabState.invalidState"
                           :loading="tabState.loading"
                           :disabled="tabState.disabled"
                           @cancel="onClickCancel"
                           @confirm="onClickConfirm"
        >
            <template #contents-conf="{tab}">
                <div class="collector-input-wrapper">
                    <p-lazy-img class="flex-shrink-0 mr-8"
                                :loading="!imageUrl"
                                :src="imageUrl"
                                width="5.5rem" height="5.5rem"
                    />
                    <div class="flex-grow">
                        <p-field-group :label="$t('PLUGIN.COLLECTOR.CREATE.NAME_LABEL')"
                                       :invalid-text="nameInvalidText"
                                       :invalid="!isNameValid"
                                       :required="true"
                        >
                            <template #default="{invalid}">
                                <p-text-input v-model="inputModel.name" class="block" :invalid="invalid" />
                            </template>
                        </p-field-group>
                        <p-field-group :label="$t('PLUGIN.COLLECTOR.CREATE.PRIORITY_LABEL')"
                                       :invalid-text="priorityInvalidText"
                                       :invalid="!isPriorityValid"
                                       :required="true"
                        >
                            <template #default="{invalid}">
                                <p-text-input v-model="inputModel.priority" type="number" class="block"
                                              :invalid="invalid"
                                />
                            </template>
                        </p-field-group>
                        <p-field-group :label="$t('PLUGIN.COLLECTOR.CREATE.VERSION_LABEL')"
                                       :invalid="!isVersionValid"
                                       :required="true"
                        >
                            <p-select-dropdown v-model="inputModel.version" :items="versions" auto-height />
                        </p-field-group>
                    </div>
                </div>
            </template>
            <template #contents-credentials>
                <confirm-credentials :provider="provider" :supported-schema="supportedSchema" class="mt-8" />
            </template>
            <template #contents-tags>
                <tags-input-group :tags.sync="tags"
                                  :show-validation="true"
                                  :is-valid.sync="isTagsValid"
                />
            </template>
        </p-progress-wizard>
    </general-page-layout>
</template>

<script lang="ts">
import { get, some } from 'lodash';

import {
    reactive, toRefs, computed, getCurrentInstance, ComponentRenderProxy,
} from '@vue/composition-api';

import {
    PProgressWizard, PSelectDropdown, PLazyImg, PIconTextButton, PBreadcrumbs, PFieldGroup, PTextInput,
} from '@spaceone/design-system';

import GeneralPageLayout from '@/common/components/layouts/GeneralPageLayout.vue';
import TagsInputGroup from '@/common/components/tags-input-group/TagsInputGroup.vue';
import ConfirmCredentials from '@/views/plugin/collector/modules/ConfirmCredentials.vue';

import { SpaceConnector } from '@/lib/space-connector';
import { showErrorMessage, showSuccessMessage } from '@/lib/util';

export default {
    name: 'CreateCollectorPage',
    components: {
        PSelectDropdown,
        PTextInput,
        PFieldGroup,
        GeneralPageLayout,
        ConfirmCredentials,
        PProgressWizard,
        TagsInputGroup,
        PIconTextButton,
        PBreadcrumbs,
        PLazyImg,
    },
    setup(props, { root }) {
        const vm = getCurrentInstance() as ComponentRenderProxy;
        const state = reactive({
            plugin: {},
            imageUrl: computed(() => state.plugin?.tags?.find(tag => tag.key === 'icon').value),
            provider: computed(() => get(state.plugin, 'provider', '')),
            pluginId: get(root, '$route.params.pluginId', ''),
            tags: [],
            supportedSchema: [],
            //
            collectorNames: [],
            versions: [],
        });
        const formState = reactive({
            inputModel: {
                name: '',
                priority: 10,
                version: '',
            },
            nameInvalidText: computed(() => {
                if (formState.inputModel.name.length < 2) {
                    return vm.$t('PLUGIN.COLLECTOR.CREATE.NAME_INVALID_MIN');
                } if (state.collectorNames.includes(formState.inputModel.name)) {
                    return vm.$t('PLUGIN.COLLECTOR.CREATE.NAME_INVALID_DUPLICATED');
                }
                return '';
            }),
            isNameValid: computed(() => !(formState.inputModel.name.length < 2 || state.collectorNames.includes(formState.inputModel.name))),
            priorityInvalidText: computed(() => {
                if (formState.inputModel.priority < 1) {
                    return vm.$t('PLUGIN.COLLECTOR.CREATE.PRIORITY_INVALID_MIN');
                } if (formState.inputModel.priority > 10) {
                    return vm.$t('PLUGIN.COLLECTOR.CREATE.PRIORITY_INVALID_MAX');
                }
                return '';
            }),
            isPriorityValid: computed(() => !(formState.inputModel.priority < 1 || formState.inputModel.priority > 10)),
            versionInvalidText: computed(() => {
                if (formState.inputModel.version.length === 0) {
                    return vm.$t('PLUGIN.COLLECTOR.CREATE.VERSION_INVALID_REQUIRED');
                }
                return '';
            }),
            isVersionValid: computed(() => !(formState.inputModel.version.length === 0)),
            isConfValid: computed(() => formState.isNameValid && formState.isPriorityValid && formState.isVersionValid),
            isTagsValid: true,
        });
        const routeState = reactive({
            routes: computed(() => ([
                { name: vm.$t('MENU.PLUGIN.PLUGIN'), path: '/plugin' },
                { name: vm.$t('MENU.PLUGIN.COLLECTOR'), path: '/plugin/collector' },
                { name: vm.$t('MENU.PLUGIN.CREATE_COLLECTOR') },
            ])),
        });
        const tabState = reactive({
            tabs: computed(() => [
                {
                    name: 'conf',
                    label: vm.$t('PLUGIN.COLLECTOR.CREATE.TAB_SET_COLLECTOR'),
                },
                {
                    name: 'credentials',
                    label: vm.$t('PLUGIN.COLLECTOR.CREATE.TAB_CONFIRM_CREDENTIALS'),
                },
                {
                    name: 'tags',
                    label: vm.$t('PLUGIN.COLLECTOR.CREATE.TAB_ADD_TAG'),
                    optional: true,
                },
            ]),
            activeIdx: 0,
            loading: false,
            invalidState: computed(() => ({
                conf: !formState.isConfValid,
                credentials: false,
                tags: !formState.isTagsValid,
            })),
            disabled: computed(() => some(tabState.invalidState, v => v === true)),
        });

        /* api */
        const getPlugin = async () => {
            try {
                const res = await SpaceConnector.client.repository.plugin.get({
                    plugin_id: state.pluginId,
                });
                state.plugin = res;
                state.supportedSchema = res.capability.supported_schema;
            } catch (e) {
                console.error(e);
                showErrorMessage(vm.$t('PLUGIN.COLLECTOR.CREATE.ALT_E_GET_PLUGIN_TITLE'), e, vm.$root);
            }
        };
        const getNames = async () => {
            const res = await SpaceConnector.client.inventory.collector.list({
                query: {
                    only: ['name'],
                },
            });
            state.collectorNames = res.results.map(v => v.name);
        };
        const getVersions = async () => {
            try {
                state.versions = [];
                const res = await SpaceConnector.client.repository.plugin.getVersions({
                    plugin_id: state.pluginId,
                });
                res.results.forEach((value, index) => {
                    if (index === 0) {
                        state.versions.push({ type: 'item', label: `${value} (latest)`, name: value });
                    } else {
                        state.versions.push({ type: 'item', label: value, name: value });
                    }
                });
                formState.inputModel.version = res.results[0];
            } catch (e) {
                console.error(e);
                showErrorMessage(vm.$t('PLUGIN.COLLECTOR.CREATE.ALT_E_GET_VERSION_TITLE'), e, vm.$root);
            }
        };

        /* event */
        const onClickBackButton = () => {
            root.$router.push('/plugin/collector/create/plugins');
        };
        const onClickCancel = () => {
            root.$router.go(-1);
        };
        const onClickConfirm = async () => {
            if (!formState.isConfValid || !formState.isTagsValid) {
                return;
            }

            tabState.loading = true;
            const params = {
                name: formState.inputModel.name,
                priority: formState.inputModel.priority,
                tags: state.tags,
                plugin_info: {
                    plugin_id: state.pluginId,
                    version: formState.inputModel.version,
                    provider: state.provider,
                },
            };
            try {
                await SpaceConnector.client.inventory.collector.create(params);
                showSuccessMessage(vm.$t('PLUGIN.COLLECTOR.CREATE.ALT_S_CREATE_TITLE'), '', vm.$root);
                await root.$router.push('/plugin/collector');
            } catch (e) {
                console.error(e);
                showErrorMessage(vm.$t('PLUGIN.COLLECTOR.CREATE.ALT_E_CREATE_TITLE'), e, vm.$root);
            } finally {
                tabState.loading = false;
            }
        };

        const init = async () => {
            await getPlugin();
            await getNames();
            await getVersions();
        };
        init();

        return {
            ...toRefs(state),
            ...toRefs(formState),
            ...toRefs(routeState),
            tabState,
            onClickCancel,
            onClickConfirm,
            onClickBackButton,
        };
    },
};
</script>

<style lang="postcss" scoped>
.collector-creator-container {
    .collector-input-wrapper {
        @apply flex border-r border-gray-200;
        width: 50%;
        padding: 2.5rem;
        margin-top: 2rem;
        .p-text-input {
            width: 100%;
        }
    }
    .tags-input-group {
        margin-top: 2rem;
    }
}
</style>
