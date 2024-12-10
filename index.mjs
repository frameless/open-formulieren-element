import { defineCustomElements } from 'https://cdn.jsdelivr.net/npm/@utrecht/web-component-library-stencil/loader/index.js';

/* globals document */
const init = async () => {
  defineCustomElements();

  const formDefinitionResponse = await fetch('data/formDefinitions.json');
  const formDefinitionJson = await formDefinitionResponse.json();
  console.log(formDefinitionJson);
  const formStep = formDefinitionJson[0];
  const components = formStep.configuration.components;

  const fragment = document.createDocumentFragment();

  // Add form step heading
  const heading = document.createElement('utrecht-heading-2');
  heading.textContent = formStep.name;
  fragment.appendChild(heading);

  const form = document.createElement('form');
  form.method = 'POST';
  fragment.appendChild(form);

  const formFields = new Map();

  components.reduce((fragment, component) => {
    let el;

    if (component.key === 'opmerkingen' || component.type === 'textarea') {
      // use textarea for opmerkingen
      el = document.createElement('utrecht-form-field-textarea');
      el.setAttribute('label', component.label);     
      // ad rows="x"
      el.setAttribute('rows', '4');
    } else {
      // Use default textbox
      el = document.createElement('utrecht-form-field-textbox');
      el.setAttribute('label', component.label);
      el.placeholder = component.label;
    }

    el.name = component.key;

    // Create a form field label and add it to the `label` slot
    // const labelSpan = document.createElement('span');
    // labelSpan.textContent = component.label;
    // labelSpan.slot = 'label';
    // el.appendChild(labelSpan);

    if (component.validate) {
      if (component.validate.required) {
        el.setAttribute('required', 'required');
      }
    }
    if (component.disabled) {
      el.setAttribute('disabled', 'disabled');
    }

    if (component.autofocus) {
      el.setAttribute('autofocus', 'autofocus');
    }

    formFields.set(component.key, el);

    el.hidden = !!component.hidden;

    fragment.appendChild(el);
    return fragment;
  }, form);

  const actionGroup = document.createElement('utrecht-button-group');
  const submitButton = document.createElement('utrecht-button');
  submitButton.setAttribute('appearance', 'primary-action-button');
  submitButton.setAttribute('type', 'submit');
  submitButton.textContent = 'Volgende'; // TODO: Get from translation literals
  actionGroup.appendChild(submitButton);
  form.appendChild(actionGroup);

  form.addEventListener('submit', (event) => {
    console.log('submit', event);
    event.preventDefault();

    const validationErrors = formStep.configuration.components.reduce((errors, component) => {
      if (component.validate) {
        const input = form.elements[component.key];
        const value = input.value;
        const formField = formFields.get(component.key);

        if (component.validate.required && !value) {
          const error = new Error(`Vul het veld ${component.label} in, dat is verplicht.`);
          errors.push(error);

          formField.setAttribute('invalid', 'true');
          const errorMessage = document.createElement('utrecht-form-field-error-message');
          errorMessage.textContent = error.message;
          errorMessage.setAttribute('slot', 'error-message');
          formField.appendChild(errorMessage);
        } else {
          const errorMessageElements = formField.querySelectorAll('utrecht-form-field-error-message');
          errorMessageElements.forEach((el) => el.parentNode.removeChild(el));
          formField.removeAttribute('invalid');
        }
      }
      return errors;
    }, []);

    if (validationErrors.length > 0) {
      const alert = document.createElement('utrecht-alert');
      alert.setAttribute('type', 'error');
      validationErrors.reduce((alert, error) => {
        const paragraph = document.createElement('utrecht-paragraph');
        paragraph.textContent = error.message;
        alert.appendChild(paragraph);
        return alert;
      }, alert);
      form.insertBefore(alert, form.firstChild);
      alert.focus();
      alert.scrollIntoView();
    } else {
      // Hide the form step rendering, replace it with the form summary
      form.style.display = 'none';

      createCheckStep(formStep);
    }
  });

  const noscript = document.querySelector('noscript#generated');

  const createCheckStep = (formStep) => {
    const step = document.createElement('div');
    const dl = document.createElement('dl');
    dl.className = 'utrecht-data-list utrecht-data-list--html-dl';
    formStep.configuration.components.reduce((dl, component) => {
      const div = document.createElement('div');
      div.className = 'utrecht-data-list__item';
      const dt = document.createElement('dt');
      dt.className = 'utrecht-data-list__item-key';
      dt.textContent = component.label;
      const dd = document.createElement('dd');
      dd.className = 'utrecht-data-list__item-value';
      dd.textContent = form.elements[component.key].value;
      div.appendChild(dt);
      div.appendChild(dd);
      dl.appendChild(div);
      return dl;
    }, dl);

    const confirmForm = document.createElement('form');
    const actionGroup = document.createElement('utrecht-button-group');
    const submitButton = document.createElement('utrecht-button');
    submitButton.setAttribute('appearance', 'primary-action-button');
    submitButton.setAttribute('type', 'submit');
    submitButton.textContent = 'Verzenden'; // TODO: Get from translation literals
    actionGroup.appendChild(submitButton);
    confirmForm.appendChild(actionGroup);

    confirmForm.addEventListener('submit', () => {
      step.parentNode.removeChild(step);

      const succcessAlert = document.createElement('utrecht-alert');
      succcessAlert.setAttribute('type', 'ok');
      succcessAlert.textContent = 'Het formulier is verzonden, alles is gelukt! Komt goed!';

      noscript.parentNode.insertBefore(succcessAlert, noscript);
    });

    step.appendChild(dl);
    step.appendChild(confirmForm);

    noscript.parentNode.insertBefore(step, noscript);
  };

  noscript.parentNode.insertBefore(fragment, noscript);
};

init();
