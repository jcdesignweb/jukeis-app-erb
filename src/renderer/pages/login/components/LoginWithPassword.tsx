import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Button, Input, InputRef } from 'antd';
import { t } from 'i18next';
import { useRef } from 'react';
import { Channels } from '../../../../main/ipc/channels';

export type LoginPasswordProps = {
  callback: (passwordVerify: boolean) => void;
};

export const LoginWithPassword: React.FC<LoginPasswordProps> = ({
  callback,
}) => {
  const inputPasswordRef = useRef<InputRef>(null);

  const onAcceptClick = async () => {
    const password = inputPasswordRef.current?.input?.value;

    if (password) {
      const passwordVerify: boolean = await window.electron.ipcRenderer.invoke(
        Channels.PASSWORD_VERIFY,
        password,
      );
      callback(passwordVerify);
    } else {
      console.warn('password is empty');
    }
  };

  return (
    <div id="LoginWithPassword">
      <Input.Password
        ref={inputPasswordRef}
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
