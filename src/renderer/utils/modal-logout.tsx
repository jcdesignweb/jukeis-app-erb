import { ExclamationCircleOutlined } from '@ant-design/icons';

const logoutModal = (modal: any, okCallback: () => void) => {
  modal.confirm({
    title: 'Cerrar sesion',
    icon: <ExclamationCircleOutlined />,
    content: '¿Esta seguro?',
    okText: 'Ok',
    onOk: okCallback,
    cancelText: 'Cancelar',
  });
};

export default logoutModal;
