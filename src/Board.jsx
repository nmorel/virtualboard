import React from 'react'

/** @jsx jsx */
import {jsx, css} from '@emotion/core'
import {useWindowResize} from './useWindowResize'
import {BoardStore} from './model'
import {observer} from 'mobx-react-lite'

const lorem = `Le Lorem Ipsum est simplement du faux texte employé dans la composition et la mise en page avant impression. Le Lorem Ipsum est le faux texte standard de l'imprimerie depuis les années 1500, quand un imprimeur anonyme assembla ensemble des morceaux de texte pour réaliser un livre spécimen de polices de texte. Il n'a pas fait que survivre cinq siècles, mais s'est aussi adapté à la bureautique informatique, sans que son contenu n'en soit modifié. Il a été popularisé dans les années 1960 grâce à la vente de feuilles Letraset contenant des passages du Lorem Ipsum, et, plus récemment, par son inclusion dans des applications de mise en page de texte, comme Aldus PageMaker.`
const rtext = () => lorem.substring(0, Math.floor(Math.random() * Math.floor(lorem.length)))

const data = [
    {
        id: '1',
        top: -50,
        left: 300,
        color: 'blue',
        text: rtext(),
    },
    {
        id: '2',
        top: 250,
        left: 700,
        color: 'yellow',
        text: rtext(),
    },
    {
        id: '3',
        top: -500,
        left: -1700,
        color: 'yellow',
        text: rtext(),
    },
]
for (let i = 3; i < 10; i++) {
    data.push({
        id: `${i + 1}`,
        top: Math.round(10000 * Math.random() * (Math.random() < 0.5 ? -1 : 1)),
        left: Math.round(10000 * Math.random() * (Math.random() < 0.5 ? -1 : 1)),
        color: 'yellow',
        text: rtext(),
    })
}

const store = BoardStore.create({items: data})

export const Board = () => {
    const wrapperRef = React.useRef(null)
    const [dimensions, setDimensions] = React.useState({width: 0, height: 0})
    const windowResizeCb = React.useCallback(() => {
        if (!wrapperRef.current) return
        setDimensions({
            width: wrapperRef.current.clientWidth,
            height: wrapperRef.current.clientHeight,
        })
    }, [])
    useWindowResize(windowResizeCb)

    return (
        <div
            ref={wrapperRef}
            css={css`
                position: relative;
                overflow: hidden;
                width: 100%;
                height: 100%;
            `}
        >
            {!!dimensions.width && !!dimensions.height && (
                <MainBoard dimensions={dimensions} store={store} />
            )}
        </div>
    )
}

const getMousePosFromEvent = e => ({
    x: e.clientX,
    y: e.clientY,
})

const reducer = (state, action) => {
    switch (action.type) {
        case 'mousedown':
            return {
                ...state,
                mousedown: true,
                lastMousePosition: action.position,
            }
        case 'mousemove': {
            if (state.mousedown) {
                return {
                    ...state,
                    panning: true,
                    lastMousePosition: action.position,
                    translateX: state.translateX + (action.position.x - state.lastMousePosition.x),
                    translateY: state.translateY + (action.position.y - state.lastMousePosition.y),
                }
            } else {
                return state
            }
        }
        case 'mouseup':
            return {
                ...state,
                mousedown: false,
                lastMousePosition: null,
                panning: false,
            }
        case 'mousewheel': {
            return {
                ...state,
                scale: Math.max(0.1, Math.min(10, state.scale + 0.1 * (action.delta < 0 ? -1 : 1))),
            }
        }
        default:
            break
    }
    return state
}

const MainBoard = observer(({dimensions, store}) => {
    const [state, dispatch] = React.useReducer(reducer, {
        panning: false,
        panStart: null,
        panCurrent: null,
        // We want the (0, 0) coordinate to be at the top left corner of the board by default
        translateX: 0,
        translateY: 0,
        scale: 1,
    })
    const {mousedown, translateX, translateY, scale} = state

    React.useLayoutEffect(() => {
        if (!mousedown) {
            return
        }
        const onMouseMove = e => dispatch({type: 'mousemove', position: getMousePosFromEvent(e)})
        const onMouseUp = e => dispatch({type: 'mouseup', position: getMousePosFromEvent(e)})
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
        return () => {
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
        }
    }, [mousedown])

    const totalWidth = dimensions.width / scale
    const totalHeight = dimensions.height / scale
    const left = -translateX / scale
    const top = -translateY / scale
    const visibleBounds = {
        left: left,
        top: top,
        right: left + totalWidth,
        bottom: top + totalHeight,
    }

    return (
        <div
            css={{
                position: 'relative',
                width: dimensions.width,
                height: dimensions.height,
            }}
            onMouseDown={e => dispatch({type: 'mousedown', position: getMousePosFromEvent(e)})}
            onWheel={e =>
                dispatch({
                    type: 'mousewheel',
                    position: getMousePosFromEvent(e),
                    delta: e.deltaY,
                })
            }
        >
            <div
                css={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 0,
                    height: 0,
                    willChange: 'transform',
                    transform: `translate(${translateX}px, ${translateY}px) scale(${scale}, ${scale})`,
                }}
            >
                {store.items
                    .filter(
                        d =>
                            d.top < visibleBounds.bottom &&
                            d.top + d.height > visibleBounds.top &&
                            d.left < visibleBounds.right &&
                            d.left + d.width > visibleBounds.left
                    )
                    .map(d => (
                        <Item key={d.id} store={store} item={d} />
                    ))}
            </div>
        </div>
    )
})

const Item = observer(({store, item}) => {
    const ref = React.useRef(null)
    React.useEffect(() => {
        item.setDimensions({width: item.width, height: ref.current.clientHeight})
    }, [])

    const [isDown, setIsDown] = React.useState(false)
    const [lastPos, setLastPos] = React.useState({x: 0, y: 0})
    React.useLayoutEffect(() => {
        if (!isDown) {
            return
        }
        const onMouseMove = e => {
            const newPos = getMousePosFromEvent(e)
            item.setPosition({
                left: item.left + (newPos.x - lastPos.x),
                top: item.top + (newPos.y - lastPos.y),
            })
            setLastPos(newPos)
        }
        const onMouseUp = () => setIsDown(false)
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
        return () => {
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
        }
    }, [isDown, lastPos])

    const isSelected = store.selected === item
    return (
        <div
            css={[
                css`
                    position: absolute;
                    top: ${item.top - 8}px;
                    left: ${item.left - 8}px;
                    width: ${item.width}px;
                    border: 0;
                    outline: 0;
                    user-select: none;
                    cursor: pointer;
                    padding: 7px;
                    border: 1px solid transparent;
                    backface-visibility: hidden;
                `,
                isSelected &&
                    css`
                        border-color: blue;
                    `,
            ]}
            onMouseDown={e => {
                e.stopPropagation()
                setLastPos(getMousePosFromEvent(e))
                setIsDown(true)
            }}
            onClick={() => {
                store.setSelected(item)
            }}
        >
            <div
                ref={ref}
                css={css`
                    background: ${item.color};
                    box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.3);
                `}
            >
                <div
                    css={css`
                        padding: 20px;
                        text-align: center;
                        font-size: 14px;
                    `}
                >
                    {item.text}
                </div>
            </div>
        </div>
    )
})
