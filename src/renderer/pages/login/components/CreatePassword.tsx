import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Button, Input, InputRef } from 'antd';
import { t } from 'i18next';
import { Channels } from '../../../../main/ipc/channels';
import { useRef } from 'react';

export type CreatePasswordProps = {
  callback: (registerStatus: boolean) => void;
};

export const CreatePassword: React.FC<CreatePasswordProps> = ({ callback }) => {
  const inputPasswordRef = useRef<InputRef>(null);
  const onAcceptClick = async () => {
    const password = inputPasswordRef.current?.input?.value;
    if (password) {
      /**
       * assign the master password
       */
      const register: boolean = await window.electron.ipcRenderer.invoke(
        Channels.REGISTER,
        password,
      );

      callback(register);
    }
  };

  return (
    <div id="CreatePassword">
      <Input.Password
        ref={inputPasswordRef}
        placeholder="Ingrese una clave segura"
        iconRender={(visible) =>
          visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
        }
      />

      <br />
      <Button type="primary" style={{ marginTop: 8 }} onClick={onAcceptClick}>
        {t('login.buttonPasswordAccept')}
      </Button>
    </div>
  );
};
