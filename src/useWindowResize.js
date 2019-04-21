import {useEffect} from 'react'

export const useWindowResize = cb => {
    useEffect(() => {
        cb()
        window.addEventListener('resize', cb)
        return () => window.removeEventListener('resize', cb)
    }, [cb])
}
