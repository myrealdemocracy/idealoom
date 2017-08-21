import { loadTranslations, setLocale, syncTranslationWithStore } from 'react-redux-i18n';

import { updateSelectedLocale } from '../actions/adminActions';
import configureStore from './configureStore';
import middlewares from './middlewares';
import rootReducer from '../reducers/rootReducer';
import { getLocale, getTranslations } from '../utils/globalFunctions';

export default function createAppStore(apolloClient, initialState) {
  middlewares.push(apolloClient.middleware());
  const store = configureStore(initialState, rootReducer, middlewares);
  if (module.hot) {
    module.hot.accept('../reducers/rootReducer', () => {
      const nextRootReducer = require('../reducers/rootReducer').default; // eslint-disable-line
      store.replaceReducer(nextRootReducer);
    });
  }
  const browserLanguage = navigator.language || navigator.userLanguage;
  const isStoragedlocale = localStorage.getItem('locale') !== null;
  const userLocale = isStoragedlocale ? localStorage.getItem('locale') : getLocale(browserLanguage);
  syncTranslationWithStore(store);
  store.dispatch(loadTranslations(getTranslations()));
  store.dispatch(setLocale(userLocale));
  store.dispatch(updateSelectedLocale(userLocale));
  return store;
}