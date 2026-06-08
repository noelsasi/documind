import React from "react";
import { api } from "../lib/api";
import { Delete24Regular } from "@fluentui/react-icons";

interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

const initialTodo: Todo = {
  id: "",
  title: "",
  description: "",
  completed: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
function TodosPage() {
  const [todos, setTodos] = React.useState<Todo[]>([]);
  const [newTodo, setNewTodo] = React.useState<Todo>(initialTodo);

  const handleNewTodoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTodo({
      ...newTodo,
      [name]: value,
      description: "",
    });
  };

  const handleNewTodoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await api.post("/todos", newTodo);
      fetchTodos();
      setNewTodo(initialTodo);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await api.delete(`/todos/${id}`);
      fetchTodos();
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTodos = async () => {
    const { data } = await api.get("/todos");
    setTodos(data.data);
  };

  React.useEffect(() => {
    fetchTodos();
  }, []);

  const remainingCount = todos.filter((t) => !t.completed).length;

  return (
    <div
      style={{
        minHeight: "90vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f7",
        padding: "2rem 1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          backgroundColor: "#ffffff",
          borderRadius: "1.5rem",
          boxShadow: "0 18px 45px rgba(0,0,0,0.06)",
          padding: "2.5rem 2rem",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 600,
              textAlign: "left",
              marginBottom: "0.25rem",
              color: "#111827",
            }}
          >
            Your To Do List
          </h1>
          <form onSubmit={handleNewTodoSubmit}>
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <input
                placeholder="Add new task"
                name="title"
                value={newTodo.title}
                onChange={handleNewTodoChange}
                style={{
                  flex: 1,
                  border: "none",
                  borderBottom: "1px solid #d1d5db",
                  padding: "0.4rem 0",
                  fontSize: "0.9rem",
                  outline: "none",
                  color: "#6b7280",
                  backgroundColor: "transparent",
                }}
              />
              <button
                type="submit"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#374151",
                  color: "#ffffff",
                  fontSize: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                +
              </button>
            </div>
          </form>
        </div>

        {/* Todo list */}
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {todos.map((todo) => {
            const created = new Date(todo.createdAt).toLocaleDateString();

            return (
              <li
                key={todo.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "18px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#fafafa",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    readOnly
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: "default",
                      accentColor: "#4b5563",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 500,
                        color: "#111827",
                        textDecoration: todo.completed
                          ? "line-through"
                          : "none",
                        opacity: todo.completed ? 0.6 : 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {todo.title}
                    </span>
                    {todo.description && (
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#6b7280",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {todo.description}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#9ca3af",
                    whiteSpace: "nowrap",
                  }}
                >
                  {created}
                </span>

                <button
                  type="button"
                  onClick={() => handleDeleteTodo(todo.id)}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                  }}
                >
                  {" "}
                  <Delete24Regular />
                </button>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div style={{ marginTop: "1.75rem" }}>
          <p
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#111827",
              marginBottom: "0.35rem",
            }}
          >
            Your remaining todos : {remainingCount}
          </p>
          <p
            style={{
              fontSize: "0.8rem",
              color: "#9ca3af",
              fontStyle: "italic",
              lineHeight: 1.4,
            }}
          >
            &quot;Doing what you love is the cornerstone of having abundance in
            your life.&quot; – Wayne Dyer
          </p>
        </div>
      </div>
    </div>
  );
}

export default TodosPage;
