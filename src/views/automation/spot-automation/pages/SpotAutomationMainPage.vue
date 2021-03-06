<template>
    <vertical-page-layout :min-width="0" :init-width="260" :max-width="400">
        <template #sidebar>
            <aside class="sidebar-menu">
                <sidebar-title :title="'즐겨찾기'">
                    <template #extra>
<!--                        &nbsp;<span class="count">({{ favoriteItems.length }})</span>-->
                    </template>
                </sidebar-title>
<!--                <favorite-list :items="favoriteItems" class="favorite-list" @delete="onFavoriteDelete" />-->
                <div v-for="(item) in menuList" :key="item.label"
                     @click="showPage(item.routeName)"
                >
                    <sidebar-title :title="item.label"
                                   :selected="item.label === selectedItem.label"
                                   style-type="link"
                    />
                </div>
            </aside>
        </template>
        <template #default>
            <router-view />
        </template>
    </vertical-page-layout>
</template>

<script lang="ts">
import {
    ComponentRenderProxy, computed, getCurrentInstance, reactive, toRefs, watch,
} from '@vue/composition-api';
import VerticalPageLayout from '@/common/components/layouts/VerticalPageLayout.vue';
import VueI18n from 'vue-i18n';
import { FavoriteItem } from '@/store/modules/favorite/type';
import FavoriteList from '@/common/modules/favorite-list/FavoriteList.vue';
import SidebarTitle from '@/common/components/sidebar-title/SidebarTitle.vue';

import TranslateResult = VueI18n.TranslateResult;

interface MenuItem {
    routeName: string;
    label: TranslateResult;
}

export default {
    name: 'SpotAutomationMainPage',
    components: {
        SidebarTitle,
        VerticalPageLayout,
        FavoriteList,
    },
    setup() {
        const vm = getCurrentInstance() as ComponentRenderProxy;
        const state = reactive({
            menuList: computed(() => [
                {
                    routeName: 'spotDashboard',
                    label: vm.$t('AUTOMATION.SPOT_AUTOMATION.MAIN.DASHBOARD'),
                },
                {
                    routeName: 'spotGroup',
                    label: vm.$t('AUTOMATION.SPOT_AUTOMATION.MAIN.SPOT_GROUP'),
                },
            ]) as unknown as MenuItem[],
            selectedItem: {} as MenuItem,
            favoriteItems: computed(() => vm.$store.getters['favorite/spotGroup/sortedItems']),
        });

        const onFavoriteDelete = (item: FavoriteItem) => {
            vm.$store.dispatch('favorite/spotGroup/removeItem', item);
        };

        const showPage = (routeName) => {
            vm.$router.replace({ name: routeName }).catch(() => {});
        };
        const selectSidebarItem = (route) => {
            if (route) state.selectedItem = state.menuList.find(d => d.routeName === route) as MenuItem;
        };

        watch(() => vm.$route.name, (after) => {
            selectSidebarItem(after);
        });

        (async () => {
            selectSidebarItem(vm.$route.name);
            // await vm.$store.dispatch('favorite/spotGroup/load');
        })();

        return {
            ...toRefs(state),
            showPage,
            onFavoriteDelete,
        };
    },
};
</script>

<style lang="postcss" scoped>
.vertical-page-layout::v-deep {
    .right-container {
        .page-contents {
            padding: 0;
        }
    }
}
</style>
