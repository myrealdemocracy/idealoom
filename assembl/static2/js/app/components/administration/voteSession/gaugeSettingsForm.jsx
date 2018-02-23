// @flow
import React from 'react';
import { connect } from 'react-redux';
import { SplitButton, MenuItem, Radio, Checkbox, Button } from 'react-bootstrap';
import range from 'lodash/range';
import { Translate, I18n } from 'react-redux-i18n';
import SectionTitle from '../sectionTitle';
import NumberGaugeForm from './numberGaugeForm';
import TextGaugeForm from './textGaugeForm';
import { getEntryValueForLocale } from '../../../utils/i18n';
import {
  updateGaugeVoteInstructions,
  updateGaugeVoteNbTicks,
  updateGaugeVoteIsNumber,
  createGaugeVoteChoice,
  deleteGaugeVoteChoice
} from '../../../actions/adminActions/voteSession';
import FormControlWithLabel from '../../common/formControlWithLabel';

type GaugeSettingsFormProps = {
  gaugeModuleId: string,
  choices: Array<Object>,
  nbTicks: number,
  instructions: string,
  handleInstructionsChange: Function,
  handleNumberGaugeCheck: Function,
  handleNbTicksSelectChange: Function,
  handleNumberGaugeUncheck: Function,
  isNumberGauge: boolean
};

const DumbGaugeSettingsForm = ({
  gaugeModuleId,
  choices,
  nbTicks,
  instructions,
  handleInstructionsChange,
  handleNbTicksSelectChange,
  handleNumberGaugeCheck,
  handleNumberGaugeUncheck,
  isNumberGauge
}: GaugeSettingsFormProps) => (
  <div className="gauge-modal-form-container">
    <SectionTitle title={I18n.t('administration.gaugeModal.title')} annotation={I18n.t('administration.gaugeModal.subTitle')} />
    <form className="gauge-modal-form">
      <div className="flex margin-m">
        <FormControlWithLabel
          value={instructions}
          label={I18n.t('administration.gaugeVoteInstructions')}
          required
          type="text"
          onChange={handleInstructionsChange}
        />
      </div>
      <div className="flex">
        <label htmlFor={`dropdown-${gaugeModuleId}`}>
          <Translate value="administration.nbTicks" />
        </label>
      </div>
      <SplitButton
        title={nbTicks}
        id={`dropdown-${gaugeModuleId}`}
        required
        onSelect={(eventKey) => {
          handleNbTicksSelectChange(eventKey, isNumberGauge, nbTicks);
        }}
      >
        {range(10).map(value => (
          <MenuItem key={`gauge-notch-${value + 1}`} eventKey={value + 1}>
            {value + 1}
          </MenuItem>
        ))}
      </SplitButton>
      <div className="margin-m">
        <Radio onChange={handleNumberGaugeUncheck} checked={!isNumberGauge} name={'gauge-radio-text'}>
          <Translate value="administration.textValue" />
        </Radio>
        <Radio onChange={handleNumberGaugeCheck} checked={isNumberGauge} name={'gauge-radio-number'}>
          <Translate value="administration.numberValue" />
        </Radio>
      </div>
      {isNumberGauge && <NumberGaugeForm id={gaugeModuleId} />}
      {!isNumberGauge &&
        choices.map((cid, idx) => <TextGaugeForm key={`gauge-choice-${idx}`} id={cid} index={idx} editLocale="fr" />)}
      <Checkbox>
        <Translate value="administration.gaugeModal.checkboxLabel" />
      </Checkbox>
      <Button className="save-button button-submit button-dark full-size" onClick={() => {}}>
        <Translate value="administration.saveThemes" />
      </Button>
    </form>
  </div>
);

const mapStateToProps = (state, { gaugeModuleId, editLocale }) => {
  const module = state.admin.voteSession.modulesById.get(gaugeModuleId);
  const instructions = getEntryValueForLocale(module.get('instructionsEntries'), editLocale);
  return {
    instructions: instructions,
    nbTicks: module.get('isNumberGauge') ? module.get('nbTicks') : module.get('choices').size,
    isNumberGauge: module.get('isNumberGauge'),
    choices: module.get('isNumberGauge') ? null : module.get('choices')
  };
};

const mapDispatchToProps = (dispatch, { gaugeModuleId, editLocale }) => ({
  handleInstructionsChange: e => dispatch(updateGaugeVoteInstructions(gaugeModuleId, editLocale, e.target.value)),
  handleNbTicksSelectChange: (value, isNumberGauge, nbTicks) => {
    if (isNumberGauge) {
      dispatch(updateGaugeVoteNbTicks(gaugeModuleId, value));
    } else if (nbTicks < value) {
      const nbChoiceToCreate = value - nbTicks;
      for (let i = 0; i < nbChoiceToCreate; i += 1) {
        const newId = Math.round(Math.random() * -1000000).toString();
        dispatch(createGaugeVoteChoice(gaugeModuleId, newId));
      }
    } else {
      const nbChoiceToDelete = nbTicks - value;
      for (let i = 0; i < nbChoiceToDelete; i += 1) {
        dispatch(deleteGaugeVoteChoice(gaugeModuleId, nbTicks - 1 - i));
      }
    }
  },
  handleNumberGaugeCheck: () => dispatch(updateGaugeVoteIsNumber(gaugeModuleId, true)),
  handleNumberGaugeUncheck: () => dispatch(updateGaugeVoteIsNumber(gaugeModuleId, false))
});

export { DumbGaugeSettingsForm };

export default connect(mapStateToProps, mapDispatchToProps)(DumbGaugeSettingsForm);