import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, CreateUserDto } from '@songmore/common';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({
      $or: [
        { email: createUserDto.email },
        { username: createUserDto.username },
      ],
    });

    if (existingUser) {
      throw new ConflictException('Email or username already exists');
    }

    if (createUserDto.password) {
      createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
    }

    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findByOAuthId(provider: string, providerId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      [`oauthProviders.${provider}`]: providerId,
    }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    if (updateUserDto.email || updateUserDto.username) {
      const query: any = { _id: { $ne: id }, $or: [] };
      if (updateUserDto.email) query.$or.push({ email: updateUserDto.email });
      if (updateUserDto.username) query.$or.push({ username: updateUserDto.username });

      const existingUser = await this.userModel.findOne(query);
      if (existingUser) {
        throw new ConflictException('Email or username already exists');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async remove(id: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async addOAuthProvider(
    userId: string,
    provider: string,
    providerId: string,
  ): Promise<UserDocument> {
    const user = await this.findById(userId);
    user.oauthProviders.set(provider, providerId);
    return user.save();
  }

  async setServiceData(
    userId: string,
    service: string,
    data: any,
  ): Promise<UserDocument> {
    const user = await this.findById(userId);
    user.serviceData.set(service, data);
    return user.save();
  }

  async getServiceData(
    userId: string,
    service: string,
  ): Promise<any | null> {
    const user = await this.findById(userId);
    return user.serviceData.get(service) || null;
  }
}
