import React from 'react'
/** @jsx jsx */
import {jsx, css, Global} from '@emotion/core'
import {Board} from './Board'

export const App = () => (
    <>
        <Global
            styles={css`
                html,
                body,
                #root {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                }
            `}
        />
        <div
            css={css`
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
            `}
        >
            <header
                css={css`
                    padding: 10px;
                    text-align: center;
                    font-size: 24px;
                `}
            >
                Virtual Board
            </header>
            <section css={{background: 'red', flex: 1}}>
                <Board />
            </section>
        </div>
    </>
)
