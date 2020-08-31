export const loadAll = async ({ dispatch }): Promise<void|Error> => {
    await Promise.all([
        dispatch('provider/load'),
        dispatch('project/load'),
        dispatch('serviceAccount/load'),
        dispatch('secret/load'),
        dispatch('collector/load'),
    ]);
};