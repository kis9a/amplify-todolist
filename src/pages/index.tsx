import React, { useState } from 'react'
import awsExports from '../aws-exports'
import Amplify from 'aws-amplify'
import { AmplifyAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react'
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components'
import { GraphQLResult } from '@aws-amplify/api'
import { API, graphqlOperation } from 'aws-amplify'
import { listTodos } from '../graphql/queries'
import { createTodo, deleteTodo, updateTodo } from '../graphql/mutations'
import Loading from '../components/loading'
import IconDown from '../components/icons/down'
import IconUp from '../components/icons/up'
import IconEdit from '../components/icons/edit'
import IconDelete from '../components/icons/delete'
import IconCheck from '../components/icons/check'
import IconCreate from '../components/icons/create'
import Input from '../components/input'
import Textarea from '../components/textarea'
import {
  CreateTodoInput,
  UpdateTodoInput,
  DeleteTodoInput,
  ListTodosQuery
} from '../types/API'

type TodoItem = {
  id: string
  name: string
  description?: string
  isEditItemName?: boolean
  isOpenItemDetail?: boolean
}

const Todo = () => {
  // state{{{
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [addedTodoId, setAddedTodoId] = useState<number>(0)
  const [todoItems, setTodoItems] = useState<TodoItem[]>([])
  const [newTodoNameInput, setNewTodoNameInput] = useState<string>('')
  const [
    newTodoDescriptionInput,
    setNewTodoDescriptionInput
  ] = useState<string>('')
  const [isOpenItemDetail, setIsOpenItemDetail] = useState<boolean>(true)
  //}}}

  // functions {{{
  const onCreateTodo = async () => {
    const data: CreateTodoInput = {
      name: newTodoNameInput,
      description: newTodoDescriptionInput
    }
    if (newTodoNameInput && newTodoNameInput.trim().length > 0) {
      try {
        await API.graphql(graphqlOperation(createTodo, { input: data }))
      } catch (e) {
        console.error(e)
      } finally {
        setNewTodoNameInput('')

        // await getTodoItems()
        // when onCreateTodo push new todo but no fetch new todolist \
        // and set mockId without duplicate for reduce api request

        const newTodoItems = [
          ...todoItems,
          {
            id: `${addedTodoId}`,
            name: newTodoNameInput,
            description: newTodoDescriptionInput
          }
        ]
        setTodoItems(newTodoItems)

        const setNextAddedTodoId = addedTodoId + 1
        setAddedTodoId(setNextAddedTodoId)
      }
    }
  }

  const onUpdateTodo = async (id: string, name: string) => {
    const data: UpdateTodoInput = { id: id, name: name }
    if (name && name.trim().length > 0) {
      try {
        await API.graphql(graphqlOperation(updateTodo, { input: data }))
      } catch (e) {
        console.error(e)
      } finally {
        onSetIsEdit(id, false)
      }
    }
  }

  const onDeleteTodo = async (id: string) => {
    const data: DeleteTodoInput = { id: id }
    try {
      await API.graphql(graphqlOperation(deleteTodo, { input: data }))
    } catch (e) {
      console.error(e)
    } finally {
      const newTodoItems = todoItems.filter((item) => item.id !== id)
      setTodoItems(newTodoItems)
    }
  }

  const onSetIsEdit = (id: string, is?: boolean) => {
    const newTodoItems = todoItems.map((item) => {
      if (item.id === id) {
        if (typeof is === 'boolean') {
          item.isEditItemName = is
        } else {
          item.isEditItemName = !item.isEditItemName
        }
      }
      return item
    })
    setTodoItems(newTodoItems)
  }

  // const onSetIsOpenItemDetail = (id: string, is?: boolean) => {
  //   const newTodoItems = todoItems.map((item) => {
  //   if (typeof is === 'boolean') {
  //   }
  //   })
  // }

  const onSetIsOpenItemDetail = (id: string, is?: boolean) => {
    const newTodoItems = todoItems.map((item) => {
      if (item.id === id) {
        if (typeof is === 'boolean') {
          item.isOpenItemDetail = is
        } else {
          item.isOpenItemDetail = !item.isOpenItemDetail
        }
      }
      return item
    })
    setTodoItems(newTodoItems)
  }
  const onEditTodo = (
    event: React.ChangeEvent<HTMLInputElement>,
    id: string
  ) => {
    const newTodoItems = todoItems.map((item) => {
      if (item && item.id === id) {
        item.name = event.currentTarget.value
      }
      return item
    })
    setTodoItems(newTodoItems)
  }

  const getTodoItems = async () => {
    try {
      setIsLoading(true)
      const todoItems: TodoItem[] = []
      const result = (await API.graphql(
        graphqlOperation(listTodos)
      )) as GraphQLResult<ListTodosQuery>
      // GraphQLResult and Observable<object> incorrect types for API.graphql
      // https://github.com/aws-amplify/amplify-js/issues/4257
      result.data.listTodos.items.forEach((item) =>
        todoItems.push({ ...item, isEditItemName: false })
      )
      setTodoItems(todoItems)
    } catch (e) {
      console.error(e)
    } finally {
      setTimeout(() => {
        setIsLoading(false)
      }, 1000)
    }
  }

  React.useEffect(() => {
    getTodoItems()
    // [list] is cause infinity loop
    // [] useEffect is called when mounted & unmounted
    // j
  }, [])
  //}}}

  return (
    <div className="todo-container max-w-screen-md mx-auto">
      {
        //{{{ section-input
        <div className="section-input">
          <div className="section-input-form flex items-center">
            <Input
              value={newTodoNameInput || ''}
              onChange={(event) => setNewTodoNameInput(event.target.value)}
              placeholder={'Todo*'}
              autoFocus={true}
            />
          </div>
          <div className="section-input-buttons my-2 flex justify-end">
            <div className="section-input-buttons-detail">
              <div
                className="button-detail flex flex-1 justify-center min-h-4 min-w-12 bg-gray-200 text-black py-1 px-4  rounded shadow mr-2"
                onClick={() => setIsOpenItemDetail(!isOpenItemDetail)}
              >
                {isOpenItemDetail !== true ? <IconDown /> : <IconUp />}
              </div>
            </div>
            <div
              className="section-input-buttons-create flex flex-1 justify-center bg-yellow-400 text-black py-1 px-2  rounded shadow"
              onClick={() => onCreateTodo()}
            >
              <IconCreate />
            </div>
          </div>
          {isOpenItemDetail && (
            <div className="section-input-detail-form">
              <Textarea
                value={newTodoDescriptionInput || ''}
                onChange={(event) =>
                  setNewTodoDescriptionInput(event.target.value)
                }
                placeholder={'Description?'}
                rows={4}
                autoFocus={false}
                maxLength={300}
              />
            </div>
          )}
        </div>
        //}}}
      }
      {
        //{{{ section-todos
        isLoading ? (
          <Loading />
        ) : (
          <div className="section-todoitems my-4">
            {todoItems && todoItems.length > 0 ? (
              <div className="section-todoitems-container my-4">
                {todoItems.map(
                  (item: TodoItem, index: number) =>
                    item && (
                      <div className="section-todoitem" key={index}>
                        <div className="section-todoitem-header w-full py-2 flex">
                          {item.isEditItemName !== true ? (
                            <div
                              onClick={() => onSetIsOpenItemDetail(item.id)}
                              className="flex-1 flex items-center justify-between mr-4 bg-gray-200 text-black py-2 px-2  rounded shadow"
                            >
                              <p className="section-todoitem-header-name">
                                {item.name}
                              </p>
                              <div className="section-todoitem-header-button-toggler">
                                {item.isOpenItemDetail !== true ? (
                                  <IconDown />
                                ) : (
                                  <IconUp />
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="mr-4 flex-1">
                              <Input
                                value={item.name || ''}
                                onChange={(event) =>
                                  setNewTodoNameInput(event.target.value)
                                }
                                placeholder={'Edit Todo*'}
                                maxLength={50}
                                autoFocus={true}
                              />
                            </div>
                          )}

                          {
                            <div className="section-todoitem-header-button-edit">
                              {item.isEditItemName !== true ? (
                                <button
                                  className="button-edit button-edit w-8 h-10 bg-gray-300 hover:bg-gray-300 text-black py-2 px-2 rounded shadow mr-2 text-center"
                                  onClick={() => onSetIsEdit(item.id)}
                                >
                                  <IconEdit />
                                </button>
                              ) : (
                                <button
                                  className="button-update w-8 h-10 bg-gray-300 hover:bg-gray-300 text-black py-2 px-2 rounded shadow mr-2"
                                  onClick={() => {
                                    onUpdateTodo(item.id, item.name)
                                  }}
                                >
                                  <IconCheck />
                                </button>
                              )}
                            </div>
                          }

                          <div className="section-todoitem-header-button-delete">
                            <button
                              className="button-delete w-8 h-10 bg-gray-300 hover:bg-gray-300 text-black py-2 px-2 rounded shadow"
                              onClick={() => {
                                onDeleteTodo(item.id)
                              }}
                            >
                              <IconDelete />
                            </button>
                          </div>
                        </div>
                        <div className="section-todoitem-detail">
                          <div className="section-todoitem-detail-description">
                            {item.isOpenItemDetail && (
                              <div>
                                <p>{item.description || ''}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                )}
              </div>
            ) : (
              <div className="section-no-todoitems-container text-gray-600 m-4 text-bold text-xl">
                No Todo Items
              </div>
            )}
          </div>
        )
        //}}}
      }
    </div>
  )
}

Amplify.configure(awsExports)

function Index() {
  const [authState, setAuthState] = React.useState(null)
  const [user, setUser] = React.useState(null)

  React.useEffect(() => {
    return onAuthUIStateChange((nextAuthState, authData) => {
      setAuthState(nextAuthState)
      setUser(authData)
    })
  }, [])

  return authState === AuthState.SignedIn && user ? (
    <div className="App">
      <div className="Layout m-4">
        <Todo />
        <div className="w-full text-right">
          <div className="w-12 mt-32 rounded">
            <AmplifySignOut />
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="container">
      <div className="signIn">
        <AmplifyAuthenticator />
      </div>
    </div>
  )
}

export default Index
