import { FunctionComponent, h, Fragment, JSX } from "preact";
import { useCallback, useEffect, useReducer, useState } from "preact/hooks";
import { SecretData, VaultClient } from "./client";
import { infoFromMeta, SecretInfo } from "./common";
import { Modal } from "./modal";

interface State {
  formFields?: Record<FieldName, string>;
  secretInfo?: SecretInfo;
  formerPassword?: {
    version: number;
    value: string;
    isRevealed: boolean;
  };
  error?: string;
}

type FieldName = "label" | "username" | "password";

type Action =
  | { type: "FORM_VALUE"; name: FieldName; value: string }
  | { type: "SET_INFO"; info: SecretInfo }
  | { type: "PW_FETCH"; data: SecretData }
  | { type: "PW_TOGGLE" }
  | { type: "ERROR"; message: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "FORM_VALUE": {
      return {
        ...state,
        formFields: {
          ...state.formFields,
          [action.name]: action.value,
        },
      };
    }
    case "SET_INFO": {
      return {
        ...state,
        secretInfo: action.info,
      };
    }
    case "PW_FETCH": {
      const { data, metadata } = action.data;
      return {
        ...state,
        formerPassword: {
          version: metadata.version,
          value: data?.password,
          isRevealed: true,
        },
      };
    }
    case "PW_TOGGLE": {
      if (!state.formerPassword) {
        return state;
      }
      return {
        ...state,
        formerPassword: {
          ...state.formerPassword,
          isRevealed: !state.formerPassword.isRevealed,
        },
      };
    }
    case "ERROR": {
      return {
        ...state,
        error: action.message,
      };
    }
  }
};

const FormField: FunctionComponent<{
  value: string;
  type?: string;
  label: string;
  name: FieldName;
  help?: string;
  inputOverride?: (props: any) => JSX.Element;
  dispatch: (action: Action) => void;
}> = ({ value, type, label, name, help, inputOverride, dispatch }) => {
  const fieldProps = {
    id: `${name}Input`,
    value,
    onChange: (ev) =>
      dispatch({
        type: "FORM_VALUE",
        name,
        value: ev.currentTarget.value,
      }),
  };
  return (
    <div class="form-group mb-2">
      <label for={`${name}Input`} class="my-1 px-1">
        {label}
      </label>
      {inputOverride ? (
        inputOverride(fieldProps)
      ) : (
        <input class="form-control" type={type || "text"} {...fieldProps} />
      )}
      {help && (
        <small id={`${name}InputHelp`} class="form-text text-muted">
          {help}
        </small>
      )}
    </div>
  );
};

export const EditForm: FunctionComponent<{
  path: string;
  id: string;
  client: VaultClient;
  handleClose: () => void;
}> = ({ path, id, client, handleClose }) => {
  const [{ error, secretInfo, formFields, formerPassword }, dispatch] =
    useReducer(reducer, {});

  const errorHandler = useCallback(
    (e) => dispatch({ type: "ERROR", message: e.message || e.toString() }),
    []
  );

  // Fetch metadata
  useEffect(() => {
    client
      .secretMetadata(`netbox/${path}/${id}`)
      .then((meta) =>
        dispatch({ type: "SET_INFO", info: infoFromMeta(id, meta) })
      )
      .catch(errorHandler);
  }, [path, id, client]);

  const toggleReveal = useCallback(() => {
    if (!formerPassword) {
      client
        .secretData(`netbox/${path}/${id}`)
        .then((data) => dispatch({ type: "PW_FETCH", data }))
        .catch(errorHandler);
    } else {
      dispatch({ type: "PW_TOGGLE" });
    }
  }, [client, path, id, formerPassword?.version]);

  const save = useCallback(() => {
    // save password
    if (formFields.password) {
      // todo
    }
  }, [client, formFields]);

  return (
    <Modal
      id="vaultEditSecret"
      title="Edit Secret"
      confirmText="Save"
      handleConfirm={save}
      handleClose={handleClose}
    >
      {secretInfo ? (
        <>
          <FormField
            label="Label"
            name="label"
            value={formFields?.label || secretInfo.label}
            dispatch={dispatch}
          />
          <FormField
            label="Username"
            name="username"
            value={formFields?.username || secretInfo.username}
            dispatch={dispatch}
          />
          <FormField
            label="Password"
            name="password"
            dispatch={dispatch}
            value={formFields?.password ?? formerPassword?.value}
            inputOverride={(props) => (
              <div class="input-group">
                <input
                  type={formerPassword?.isRevealed ? "text" : "password"}
                  class="form-control"
                  placeholder="Enter new password..."
                  {...props}
                />
                <div class="input-group-append">
                  <button
                    class="btn btn-secondary"
                    type="button"
                    onClick={toggleReveal}
                  >
                    <i
                      class={`mdi ${
                        formerPassword?.isRevealed
                          ? "mdi-eye-outline"
                          : "mdi-eye-off-outline"
                      }`}
                    ></i>
                  </button>
                </div>
              </div>
            )}
          />
        </>
      ) : (
        <p>Loading...</p>
      )}
      {error && (
        <pre class="mt-3 alert alert-danger" role="alert">
          {error}
        </pre>
      )}
    </Modal>
  );
};
