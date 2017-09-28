// @flow
import React from 'react';
import { Button, FormControl, FormGroup, Modal, Radio } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';

import { closeModal } from '../../../utils/utilityManager';
import LocalesQuery from '../../../graphql/LocalesQuery.graphql';
import withLoadingIndicator from '../../common/withLoadingIndicator';

type Locale = {
  label: string,
  localeCode: string
};

type ChooseContentLocaleFormProps = {
  data: {
    locales: Array<Locale>
  },
  originalLocale: string,
  updateById: (value: string) => void,
  updateByOriginalLocale: (value: string) => void
};

type Scope = 'local' | 'global';

type ChooseContentLocaleFormState = {
  scope: Scope,
  selectedLocale: string
};

class ChooseContentLocaleForm extends React.Component<*, ChooseContentLocaleFormProps, ChooseContentLocaleFormState> {
  props: ChooseContentLocaleFormProps;
  state: ChooseContentLocaleFormState;

  constructor() {
    super();
    this.state = {
      scope: 'local',
      selectedLocale: 'select'
    };
  }

  updateSelectedLocale = (selectedLocale: string): void => {
    this.setState({
      selectedLocale: selectedLocale
    });
  };

  updateScope = (scope: Scope): void => {
    this.setState({
      scope: scope
    });
  };

  handleSubmit = () => {
    const { updateById, updateByOriginalLocale } = this.props;
    const { scope, selectedLocale } = this.state;
    if (scope === 'local') {
      updateById(selectedLocale);
    } else if (scope === 'global') {
      updateByOriginalLocale(selectedLocale);
    }
    closeModal();
  };

  render() {
    const { originalLocale } = this.props;
    const { scope, selectedLocale } = this.state;
    const translateAllLabel = I18n.t('debate.thread.translateAllMessagesIn', {
      language: I18n.t(`language.${originalLocale}`)
    });
    const translateOneLabel = I18n.t('debate.thread.translateOnlyThisMessage');
    const availableLanguages = this.props.data.locales.filter((lang) => {
      return lang.localeCode !== originalLocale;
    });
    return (
      <div className="choose-content-locale-form">
        <Modal.Header closeButton />
        <Modal.Body>
          <FormGroup>
            <Radio
              checked={scope === 'global'}
              title={translateAllLabel}
              value="global"
              onChange={() => {
                return this.updateScope('global');
              }}
            >
              {translateAllLabel}
            </Radio>
            <Radio
              checked={scope === 'local'}
              title={translateOneLabel}
              value="local"
              onChange={() => {
                return this.updateScope('local');
              }}
            >
              {translateOneLabel}
            </Radio>
          </FormGroup>
          <FormGroup>
            <FormControl
              componentClass="select"
              placeholder="select"
              onChange={(e) => {
                if (e.target.value !== 'select') {
                  this.updateSelectedLocale(e.target.value);
                }
              }}
              value={selectedLocale}
            >
              <option value="select">
                {I18n.t('debate.thread.chooseLanguagePh')}
              </option>
              {availableLanguages.map((lang) => {
                return (
                  <option key={`locale-${lang.localeCode}`} value={lang.localeCode}>
                    {lang.label}
                  </option>
                );
              })}
            </FormControl>
          </FormGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button key="translate-cancel" onClick={closeModal} className="button-cancel button-dark">
            <Translate value="debate.thread.translateCancel" />
          </Button>,
          <Button
            key="translate-submit"
            disabled={selectedLocale === 'select'}
            onClick={this.handleSubmit}
            className="button-submit button-dark"
          >
            <Translate value="debate.thread.translateSubmit" />
          </Button>
        </Modal.Footer>
      </div>
    );
  }
}

export default compose(graphql(LocalesQuery), withLoadingIndicator())(ChooseContentLocaleForm);