import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { Error as ErrorMongoose, mongo } from 'mongoose';

/**
 * Filtro de excepciones global (se registra en main.ts con app.useGlobalFilters).
 * Es una "red de seguridad": los DTOs ya validan todo, pero si algún dato llega a la base y
 * Mongoose lo rechaza, Nest lo trataría como un error desconocido y respondería 500.
 * Acá se traduce a lo que corresponde:
 * - ValidationError (no cumple el schema: required, min, max, enum) -> 400 Bad Request
 * - CastError (un valor que no se puede convertir, por ejemplo un id inválido) -> 400
 * - código 11000 (índice único: correo o usuario repetido) -> 409 Conflict
 * La consigna pide "no debe haber status 200 en errores ni 400 en respuestas correctas";
 * tampoco debería haber un 500 por un dato mal mandado.
 */
@Catch(
  ErrorMongoose.ValidationError,
  ErrorMongoose.CastError,
  mongo.MongoServerError,
)
export class ErroresMongooseFilter implements ExceptionFilter {
  catch(
    error:
      | ErrorMongoose.ValidationError
      | ErrorMongoose.CastError
      | mongo.MongoServerError,
    host: ArgumentsHost,
  ) {
    const respuesta = host.switchToHttp().getResponse<Response>();

    if (error instanceof mongo.MongoServerError) {
      if (error.code === 11000) {
        return respuesta.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: 'Ya existe un registro con esos datos',
          error: 'Conflict',
        });
      }
      // Cualquier otro error del servidor de MongoDB sí es un problema nuestro -> 500
      return respuesta.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }

    const mensajes =
      error instanceof ErrorMongoose.ValidationError
        ? Object.values(error.errors).map(
            (e) => `El campo "${e.path}" no es válido`,
          )
        : [`El valor de "${error.path}" no es válido`];
    return respuesta.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: mensajes,
      error: 'Bad Request',
    });
  }
}
