import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../enums/role.enum';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: false }) // Optional for OAuth users
  password?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], enum: Role, default: [Role.USER] })
  roles: Role[];

  @Prop({ type: Map, of: String, default: new Map() })
  oauthProviders: Map<string, string>;

  @Prop({ type: Map, of: Object, default: new Map() })
  serviceData: Map<string, any>;
}

export const UserSchema = SchemaFactory.createForClass(User); 