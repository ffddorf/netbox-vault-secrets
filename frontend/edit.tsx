import { FunctionComponent, h, Fragment, JSX } from "preact";
import { useCallback, useEffect, useReducer, useState } from "preact/hooks";
import { SecretData, VaultClient } from "./client";
import { infoFromMeta, SecretInfo } from "./common";
import { Modal } from "./modal";

interface State {
  formFields?: Record<FieldName, string>;
  valid?: boolean;
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
  | { type: "PW_UPDATE"; version: number; value: string }
  | { type: "ERROR"; message: string };

const relevantFields: FieldName[] = ["label", "username"];

const allFieldsValid = (formFields: Record<FieldName, string>): boolean => {
  for (const key of relevantFields) {
    if (!(key in formFields)) {
      continue;
    }
    if (formFields[key] === "") {
      return false;
    }
  }
  return true;
};

const anyFieldChanged = (
  secretInfo: SecretInfo,
  formFields: Record<FieldName, string>
): boolean => {
  for (const key of relevantFields) {
    if (!(key in formFields)) {
      continue;
    }
    if (secretInfo[key] !== formFields[key]) {
      return true;
    }
  }
  return false;
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "FORM_VALUE": {
      const formFields = {
        ...state.formFields,
        [action.name]: action.value,
      };
      return {
        ...state,
        valid: allFieldsValid(formFields),
        formFields,
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
    case "PW_UPDATE": {
      if (!state.formerPassword) {
        return state;
      }
      return {
        ...state,
        formerPassword: {
          ...state.formerPassword,
          value: action.value,
          version: action.version,
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
  const [{ error, secretInfo, valid, formFields, formerPassword }, dispatch] =
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

  const save = useCallback(async () => {
    // validate
    if (valid === false) {
      dispatch({ type: "ERROR", message: "Fields cannot be empty" });
      return;
    }

    try {
      // save metadata
      if (anyFieldChanged(secretInfo, formFields)) {
        const payload = {
          label: formFields.label || secretInfo.label,
          username: formFields.username || secretInfo.username,
        };
        await client.secretMetadataUpdate(`netbox/${path}/${id}`, payload);
      }

      // save password
      if (formFields.password) {
        const { version } = await client.secretDataUpdate(
          `netbox/${path}/${id}`,
          {
            password: formFields.password,
          }
        );
        dispatch({ type: "PW_UPDATE", version, value: formFields.password });
      }
    } catch (e) {
      dispatch({ type: "ERROR", message: e.message || e.toString() });
      return;
    }

    dispatch({ type: "ERROR", message: "" });
    handleClose();
  }, [client, formFields, secretInfo, handleClose]);

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
