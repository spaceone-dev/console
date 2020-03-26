import {
    toRefs, reactive, ref, computed,
} from '@vue/composition-api';
import { action } from '@storybook/addon-actions';
import {
    text, number, select, object, boolean,
} from '@storybook/addon-knobs/vue';
import { getKnobProps } from '@sb/storybook-util';
import { selectableItemProps } from '@/components/molecules/selectable-item/SelectableItem.toolset';
import PSelectableItem from './SelectableItem.vue';

export default {
    title: 'molecules/SelectableItem',
    component: PSelectableItem,
    parameters: {
        info: {
            summary: '',
            components: { PSelectableItem },
        },
        knobs: { escapeHTML: false },
    },
};


const getState = (props, context) => {
    const state = reactive({});

    return state;
};



export const defaultCase = () => ({
    components: { PSelectableItem },
    props: getKnobProps(selectableItemProps, {
        icon: 'aws-ec2',
        title: 'EC2 Collector',
    }),
    template: `
    <div style="width: 80vw; border: 1px solid gray;">
        <PSelectableItem v-bind="$props"></PSelectableItem>
    </div>`,
    setup(props, context) {
        const state = getState(props, context);

        return {
            ...toRefs(state),
        };
    },
});


export const extraSlot = () => ({
    components: { PSelectableItem },
    props: getKnobProps(selectableItemProps, {
        icon: 'aws-ec2',
        title: 'EC2 Collector',
    }),
    template: `
    <div style="width: 80vw; border: 1px solid gray;">
        <PSelectableItem v-bind="$props">
            <template #extra>
                This is Extra!!
            </template>
        </PSelectableItem>
    </div>`,
    setup(props, context) {
        const state = getState(props, context);

        return {
            ...toRefs(state),
        };
    },
});