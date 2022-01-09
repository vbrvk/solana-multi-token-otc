import { useState, useCallback } from 'react'

interface IUseModalResult {
  isModalVisible: boolean
  onOpenModal: () => void
  onDestroyModal: () => void
  onToggleModal: () => void
}

const useModal = (initialIsModalVisible = false): IUseModalResult => {
  const [isModalVisible, setIsModalVisible] = useState(initialIsModalVisible)

  const handleOpen = useCallback(() => setIsModalVisible(true), [setIsModalVisible])
  const handleDestroy = useCallback(() => setIsModalVisible(false), [setIsModalVisible])
  const toggleModal = useCallback(() => {
    return setIsModalVisible((isVisible) => !isVisible)
  }, [])

  return { isModalVisible, onOpenModal: handleOpen, onDestroyModal: handleDestroy, onToggleModal: toggleModal }
}

export default useModal
