import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";

export class TodoController {
  // GET /todos - Get all todos
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const todos = await prisma.todo.findMany();

      res.json({
        success: true,
        data: todos,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /todos/:id - Get one todo
  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const todo = await prisma.todo.findUnique({ where: { id } });

      res.json({
        success: true,
        data: todo,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /todos - Create a todo
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, description } = req.body;
      const todo = await prisma.todo.create({ data: { title, description } });

      res.status(201).json({
        success: true,
        message: "Todo created successfully",
        data: todo,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /todos/:id - Update a todo
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, description, completed } = req.body;

      const todo = await prisma.todo.update({
        where: { id },
        data: { title, description, completed },
      });

      res.json({
        success: true,
        message: "Todo updated successfully",
        data: todo,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /todos/:id - Delete a todo
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.todo.delete({ where: { id } });

      res.json({
        success: true,
        message: "Todo deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export a single instance
export const todoController = new TodoController();
