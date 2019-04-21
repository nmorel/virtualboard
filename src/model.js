import {types} from 'mobx-state-tree'

export const BoardItem = types
    .model('BoardItem', {
        id: types.identifier,
        top: types.integer,
        left: types.integer,
        color: types.string,
        text: types.string,
    })
    .volatile(self => ({
        width: 160,
        height: 200,
    }))
    .actions(self => ({
        setDimensions({width, height}) {
            self.width = width
            self.height = height
        },
        setPosition({top, left}) {
            self.top = top
            self.left = left
        },
    }))

export const BoardStore = types
    .model('BoardStore', {
        items: types.array(BoardItem),
        selected: types.maybeNull(types.reference(BoardItem)),
    })
    .actions(self => ({
        setSelected(item) {
            self.selected = item
        },
    }))
