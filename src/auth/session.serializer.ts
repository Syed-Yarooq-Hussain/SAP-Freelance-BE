import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { User } from '../../models/user.model';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  serializeUser(user: any, done: Function) {
    done(null, user.id || user.sub);
  }

  async deserializeUser(id: any, done: Function) {
    try {
      const user = await User.findByPk(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  }
}
