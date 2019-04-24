import {types} from 'mobx-state-tree'

const AbstractBoardItem = types
    .model('ABoardItem', {
        id: types.identifier,
        top: types.integer,
        left: types.integer,
        type: types.enumeration(['IDEA', 'RECTANGLE']),
    })
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

const IdeaItem = types.compose(
    'IdeaItem',
    AbstractBoardItem,
    types
        .model({
            type: types.literal('IDEA'),
            color: types.string,
            text: types.string,
        })
        .volatile(self => ({
            width: 160,
            height: 200,
        }))
)

const RectangleItem = types.compose(
    'RectangleItem',
    AbstractBoardItem,
    types.model({
        type: types.literal('RECTANGLE'),
        color: types.string,
        width: types.integer,
        height: types.integer,
        filled: types.boolean,
    })
)

export const BoardItem = types.union(
    {
        eager: false,
        dispatcher(snap) {
            switch (snap && snap.type) {
                case 'IDEA':
                    return IdeaItem
                case 'RECTANGLE':
                    return RectangleItem
                default:
                    return IdeaItem
            }
        },
    },
    IdeaItem,
    RectangleItem
)

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
