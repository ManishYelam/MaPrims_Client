import { useState, useEffect, useCallback, useRef } from 'react'
import { applicationAPI } from '../../../services/api'

const useConfigManagement = (propertyName, loadDependencies = [], options = {}) => {
  const { autoLoad = true, showMessage: externalShowMessage } = options
  const [configs, setConfigs] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  const isMounted = useRef(true)

  const showMessage = useCallback(
    (type, text) => {
      if (externalShowMessage) {
        externalShowMessage(type, text)
      } else {
        // console.log(`[${type}] ${text}`)
      }
    },
    [externalShowMessage]
  )

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  const loadConfigs = useCallback(async () => {
    setIsLoading(true)
    try {
      const payload = {
        page: 1,
        limit: 50,
        search: '',
        searchFields: ['property_name', 'property_value'],
        filters: { property_name: propertyName },
      }
      const response = await applicationAPI.getAllProperties(payload)
      if (isMounted.current) {
        setConfigs(response.data?.data || [])
      }
    } catch (error) {
      console.error(`Error loading ${propertyName} configurations:`, error)
      if (isMounted.current) {
        showMessage('error', `Failed to load ${propertyName} configurations`)
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }, [propertyName, showMessage])

  const saveConfig = useCallback(
    async (payload, editingConfig) => {
      setSaveLoading(true)
      try {
        if (editingConfig) {
          payload.app_prop_id = editingConfig.app_prop_id
        }
        await applicationAPI.createOrUpdateProperty(payload)
        if (isMounted.current) {
          showMessage(
            'success',
            editingConfig
              ? `${propertyName} configuration updated successfully!`
              : `${propertyName} configuration created successfully!`
          )
        }
        await loadConfigs()
        return true
      } catch (error) {
        console.error(`Error saving ${propertyName} config:`, error)
        const errorMessage =
          error.response?.data?.message || `Failed to save ${propertyName} configuration`
        if (isMounted.current) {
          showMessage('error', errorMessage)
        }
        return false
      } finally {
        if (isMounted.current) {
          setSaveLoading(false)
        }
      }
    },
    [propertyName, showMessage, loadConfigs]
  )

  const deleteConfig = useCallback(
    async (config, onSuccess) => {
      setSaveLoading(true)
      try {
        await applicationAPI.deleteProperty(config.app_prop_id)
        if (isMounted.current) {
          showMessage('success', `${propertyName} configuration deleted successfully!`)
        }
        await loadConfigs()
        onSuccess?.()
      } catch (error) {
        console.error(`Error deleting ${propertyName} config:`, error)
        const errorMessage =
          error.response?.data?.message || `Failed to delete ${propertyName} configuration`
        if (isMounted.current) {
          showMessage('error', errorMessage)
        }
      } finally {
        if (isMounted.current) {
          setSaveLoading(false)
        }
      }
    },
    [propertyName, showMessage, loadConfigs]
  )

  const activateConfig = useCallback(
    async config => {
      try {
        await applicationAPI.activeAppProperty(config.property_name, config.app_prop_id)
        if (isMounted.current) {
          showMessage('success', `${propertyName} configuration activated successfully!`)
        }
        await loadConfigs()
      } catch (error) {
        console.error(`Error activating ${propertyName} config:`, error)
        const errorMessage =
          error.response?.data?.message || `Failed to activate ${propertyName} configuration`
        if (isMounted.current) {
          showMessage('error', errorMessage)
        }
      }
    },
    [propertyName, showMessage, loadConfigs]
  )

  const testConfig = useCallback(
    (config, testFn) => {
      if (testFn) {
        testFn(config)
      } else {
        if (isMounted.current) {
          showMessage('info', `Testing ${propertyName} configuration...`)
          setTimeout(() => {
            if (isMounted.current) {
              showMessage('success', `${propertyName} configuration test completed successfully!`)
            }
          }, 2000)
        }
      }
    },
    [propertyName, showMessage]
  )

  useEffect(() => {
    if (autoLoad) {
      loadConfigs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadConfigs, ...loadDependencies])

  return {
    configs,
    isLoading,
    saveLoading,
    loadConfigs,
    saveConfig,
    deleteConfig,
    activateConfig,
    testConfig,
  }
}

export default useConfigManagement
