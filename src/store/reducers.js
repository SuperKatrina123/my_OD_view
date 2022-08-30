import { combineReducers } from 'redux';

const initState = {
    locations: [],
    flows: [],
    config: {
        colorScheme: 'Blue',
        opacity: 1,
        clusteringEnabled: true,
        animationEnabled: false,
        locationTotalsEnabled: true,
        fadeOpacityEnabled: true,
        fadeEnabled: true,
        fadeAmount: 10,
        clusteringAuto: true,
        clusteringLevel: 10,
        darkMode: false,
        maxTopFlowsDisplayNum: 8398,
    },
    customlayers: []
}
function trajReducer(preState = initState, action) {
    const { type, data } = action;
    switch (type) {
        case 'setlocations':
            return {...preState, locations: data }
        case 'setflows':
            return {...preState, flows: data }
        case 'setconfig':
            return {...preState, config: data }
        case 'setcustomlayers':
            return {...preState, customlayers: data }
        default:
            return preState;
    }
}

export default combineReducers({
    trajReducer
})