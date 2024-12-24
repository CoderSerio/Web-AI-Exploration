import { Button, Modal } from '@arco-design/web-react'
import styles from './index.module.css'
import { useState } from 'react';
import VideoCanvas from '../VideoCard';
import VideoCardUnit from '../VideoCardUnit';

interface SceneProps {
}

const Window = (props: SceneProps) => {
  const [FERModalVisible, setFERModalVisible] = useState(false)
  const [infoModalVisible, setInfoModalVisible] = useState(false)

  return (
    <div className={styles.windowContainer}>
      <div className={styles.body}>
        {/* <Button onClick={() => setVisible(true)} type='primary'>
          Open Modal
        </Button> */}

        <div className={styles.item} onClick={() => setFERModalVisible(true)}>
          <div className={styles.icon}>🤔</div>
          <div className={styles.name}>人脸表情识别系统</div>
        </div>


        <div className={styles.item} onClick={() => setInfoModalVisible(true)}>
          <div className={styles.icon}>✨</div>
          <div className={styles.name}>项目说明</div>
        </div>

      </div>

      <Modal
        title='人脸表情识别系统'
        visible={FERModalVisible}
        onOk={() => setFERModalVisible(false)}
        onCancel={() => setFERModalVisible(false)}
        autoFocus={false}
        focusLock={true}
        style={{ width: 'auto' }}
      >
        <VideoCardUnit></VideoCardUnit>
      </Modal>


      <Modal
        title='项目说明'
        visible={infoModalVisible}
        onOk={() => setInfoModalVisible(false)}
        onCancel={() => setInfoModalVisible(false)}
        autoFocus={false}
        focusLock={true}
      >
        这是我的毕业设计作品。
        https://github.com/CoderSerio/Web-AI-Exploration
      </Modal>

      <div className={styles.footer}>
        <div className={styles.menu}>开始</div>
      </div>
    </div>
  )
}

export default Window
