import React from 'react'
import kebabCase from 'lodash/kebabCase'
import { Link } from 'gatsby'
import './style.scss'

class Menu extends React.Component {
  render() {
    const { data, categories } = this.props
    const pageItems = data.map(item => (
      <li className="menu__list-item" key={item.path}>
        <Link
          to={item.path}
          className="menu__list-item-link"
          activeClassName="menu__list-item-link menu__list-item-link--active"
        >
          {item.label}
        </Link>
      </li>
    ))


    const categoryItems = categories.map(item => (
      <li
        key={item.fieldValue}
        className="categories__list-item"
      >
        <Link
          to={`/categories/${kebabCase(
            item.fieldValue
          )}/`}
          className="categories__list-item-link"
        >
          {item.fieldValue} ({item.totalCount})
                          </Link>
      </li>
    ))

    return <>
      <nav className="menu">
        <ul className="menu__list">
          {pageItems}
        </ul>
        <ul className="categories__list">
          {categoryItems}
        </ul>
      </nav>
    </>
  }
}

export default Menu
