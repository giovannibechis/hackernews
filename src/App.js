import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import fetch from 'isomorphic-fetch';
import PropTypes from 'prop-types';

const DEFAULT_QUERY = 'php';
const DEFAULT_HPP = '10';

const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';

// ES5
/* function isSearched(searchTerm) {
  return function (item) {
    return item.title.toLowerCase().includes(searchTerm.toLowerCase());
  }
} */
// ES6
/*const isSearched = searchTerm => item =>
  item.title.toLowerCase().includes(searchTerm.toLowerCase());*/


class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      results: null,
      searchKey:'',
      searchTerm: DEFAULT_QUERY,
      error: null,
      isLoading: false,
    };

    this.needsToSearchTopStories = this.needsToSearchTopStories.bind(this);
    this.setSearchTopStories = this.setSearchTopStories.bind(this);
    this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
  }

  needsToSearchTopStories(searchTerm) {
    return !this.state.results[searchTerm];
  }
    

  setSearchTopStories(result) {

    const { hits, page } = result;
    const { searchKey, results } = this.state;

    const oldHits = results && results[searchKey]
    ? results[searchKey].hits
    : [];

    const updatedHits = [
      ...oldHits,
      ...hits
    ];

    this.setState({
      results: {
        ...results,
        [searchKey]: { hits: updatedHits, page },
      },
      isLoading: false
    });

  }

  fetchSearchTopStories(searchTerm, page = 0) {
    this.setState({ isLoading: true });

    fetch(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
      .then(response => response.json())
      .then(result => this.setSearchTopStories(result))
      .catch(e => this.setState({ error: e }));
  }

  componentDidMount() {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });
    this.fetchSearchTopStories(searchTerm);
  }

  onDismiss(id) {
    const { searchKey, results } = this.state;
    const { hits, page } = results[searchKey];
 
    const isNotId = item => item.objectID !== id;
    const updatedHits = hits.filter(isNotId);
    
    this.setState({
      result:  { 
        ...results, 
        [searchKey]: { hits: updatedHits, page }
      }
    });

  }

  onSearchChange(event) {
    this.setState({ searchTerm: event.target.value });
  }

  onSearchSubmit(event) {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });

    if (this.needsToSearchTopStories(searchTerm)) {
      this.fetchSearchTopStories(searchTerm);
    }
    event.preventDefault();
  }

  render() {
    const {
      searchTerm,
      results,
      searchKey,
      error, 
      isLoading
    } = this.state;

    const page = (
      results &&
      results[searchKey] &&
      results[searchKey].page
    ) || 0;

    const list = (
      results &&
      results[searchKey] &&
      results[searchKey].hits
    ) || [];

    
    return (     
      <div  className="page" >
        <div className="interactions">
        <Search 
            value={searchTerm}
            onChange={this.onSearchChange}
            onSubmit={this.onSearchSubmit}
        >
          Search
        </Search>
        </div>
  
        {error
          ? <div className="interactions">
            <p>Something went wrong.</p>
          </div>
          :
          <Table
            list={list}
            onDismiss={this.onDismiss}
          />               
        }               
          <div className="interactions">
            <ButtonWithLoading
              isLoading={isLoading}
              onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}>
              More
          </ButtonWithLoading>
          </div>
        
      </div >
    );
  }

}

/*function Search(props) {
  const { value, onChange, children } = props;
  return (
    <form>
      {children} <input
        type="text"
        value={value}
        onChange={onChange}
      />
    </form>
  );
}*/
  

// const Search = ({
//     value,
//     onChange,
//     onSubmit,
//     children
//   }) =>
//   <form onSubmit={onSubmit}>
//     <input
//       type="text"
//       value={value}
//       onChange={onChange}
//     />
//     <button type="submit">
//       {children}
//     </button>
//   </form>

// Search.propTypes = {
//   value:PropTypes.string,
//   onChange: PropTypes.func.isRequired,
//   onSubmit: PropTypes.func.isRequired,
//   children: PropTypes.node.isRequired
// };

class Search extends Component {

  componentDidMount() {
    if (this.input) {
      this.input.focus();
    }
  }
    
  render() {
    const {
      value,
      onChange,
      onSubmit,
      children
    } = this.props;
    return (
      <form onSubmit={onSubmit}>
        <input
          type="text"
          value={value}
          onChange={onChange}
          ref={(node) => { this.input = node; }}
        />
        <button type="submit">
          {children}
        </button>
      </form>
    );
  }
}
  

const Table =  ({list, onDismiss}) =>
    <div className="table">
    {list.map(item =>
      <div key={item.objectID} className="table-row">
        <span style={{ width: '40%' }}>
          <a href={item.url} target="_blank">{item.title}</a>
        </span>
        <span style={{ width: '30%' }}>
          {item.author}
        </span>
        <span style={{ width: '10%' }}>
          {item.num_comments}
        </span>
        <span style={{ width: '10%' }}>
          {item.points}
        </span>
        <span style={{ width: '10%' }}>
          <Button
            onClick={() => onDismiss(item.objectID)}
            className="button-inline"
          >
            Dismiss
          </Button>
        </span>

      </div>
    )}
  </div>

Table.propTypes = {
  list: PropTypes.arrayOf(
    PropTypes.shape({
      objectID: PropTypes.string.isRequired,
      author: PropTypes.string,
      url: PropTypes.string,
      num_comments: PropTypes.number,
      points: PropTypes.number,
    })
  ).isRequired,
  onDismiss: PropTypes.func,
};
  

const Button = ({onClick, className='',children})=>
  <button
    onClick={onClick}
    className={className}
    type="button"
  >
    {children}
  </button>

Button.propTypes = {
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

const Loading = () =>
<div>Loading ...</div>

const withLoading = (Component) => ({ isLoading, ...rest }) =>
  isLoading
    ? <Loading />
    : <Component {...rest}  />

const ButtonWithLoading = withLoading(Button);

export default App;

export {
  Button,
  Search,
  Table
}
