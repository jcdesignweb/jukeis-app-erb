import { ExclamationCircleOutlined } from '@ant-design/icons';
import { t } from 'i18next';

export const deleteItemModal = (modal: any, okCallback: () => void) => {
  modal.confirm({
    title: t('modal.delete-item.title'),
    icon: <ExclamationCircleOutlined />,
    content: t('modal.delete-item.message'),
    okText: t('ok'),
    onOk: okCallback,
    cancelText: t('cancel'),
  });
};
