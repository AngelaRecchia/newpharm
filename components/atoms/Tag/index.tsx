import React from 'react'
import classNames from 'classnames/bind';
import styles from './index.module.scss';
const cn = classNames.bind(styles);


const Tag = ({ tag, variant = 'primary' }: { tag: string, variant?: 'primary' | 'secondary' }) => {
    return (
        <div className={cn('wrapper', variant)}>{tag}</div>
    )
}

export default Tag