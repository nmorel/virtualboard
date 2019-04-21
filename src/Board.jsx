import React from 'react'

/** @jsx jsx */
import {jsx, css} from '@emotion/core'
import {useWindowResize} from './useWindowResize'

const data = [
    {
        id: '1',
        width: 300,
        height: 450,
        top: -50,
        left: 300,
        color: 'blue',
    },
    {
        id: '2',
        width: 160,
        height: 240,
        top: 250,
        left: 700,
        color: 'yellow',
    },
    {
        id: '3',
        width: 160,
        height: 240,
        top: -500,
        left: -1700,
        color: 'yellow',
    },
]
for (let i = 3; i < 10000; i++) {
    data.push({
        id: `${i + 1}`,
        width: Math.max(200, Math.round(500 * Math.random())),
        height: Math.max(200, Math.round(500 * Math.random())),
        top: Math.round(10000 * Math.random() * (Math.random() < 0.5 ? -1 : 1)),
        left: Math.round(10000 * Math.random() * (Math.random() < 0.5 ? -1 : 1)),
        color: 'yellow',
    })
}

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
                <MainBoard dimensions={dimensions} data={data} />
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

const MainBoard = React.memo(({dimensions, data}) => {
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

    console.log(visibleBounds)

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
                {data
                    .filter(
                        d =>
                            d.top < visibleBounds.bottom &&
                            d.top + d.height > visibleBounds.top &&
                            d.left < visibleBounds.right &&
                            d.left + d.width > visibleBounds.left
                    )
                    .map(d => (
                        <div
                            key={d.id}
                            css={css`
                                position: absolute;
                                top: ${d.top}px;
                                left: ${d.left}px;
                                width: ${d.width}px;
                                height: ${d.height}px;
                                background: ${d.color};
                                border: 0;
                                outline: 0;
                                box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.3);
                            `}
                        />
                    ))}
            </div>
        </div>
    )
})
