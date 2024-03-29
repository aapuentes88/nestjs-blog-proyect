import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { v4 as uuid } from 'uuid'
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ROLES_KEY } from 'src/common/constants/constants';
import { Role } from 'src/common/constants/enums/roles.enum';
import { ProfileService } from 'src/profile/profile.service';
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';
import * as fs from 'fs';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly profileService: ProfileService,
  ) { }

  async create(createUserDto: CreateUserDto) {
    const { /*username, email, password,*/ roles, ...rest } = createUserDto
    const user = this.userRepository.create({ ...rest, id: uuid()})
    if(roles)
     user[ROLES_KEY] = [...roles,Role.User]
    
    const profile = await this.profileService.create({})
    // profile.user = user
    user.profile = profile

    const usersaved = this.userRepository.save(user)

    return usersaved;
  }

  findOneByEmail(email: string) {
    return this.userRepository.findOneBy({ email })
  }

  findUserByUserName(username: string) {
    return this.userRepository.findOneBy({ username })
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: string) {
    return this.userRepository.findOneBy({ id })
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    console.log('update user whit post')
    // Obtener el usuario de la base de datos
  let user = await this.userRepository.findOne({where: { id: id },relations: ['posts']});

  // Aplicar las actualizaciones del DTO al usuario
  console.log(user)
  console.log('-----------------------------')
  let nPosts =   updateUserDto.posts ? updateUserDto.posts :  []
  user.posts ? user.posts = [...nPosts, ...user.posts] : user.posts = nPosts

  const {posts, ...userWithoutPost} = updateUserDto  
  user = {...user, ...userWithoutPost}
  console.log(user)
  // if (updateUserDto.posts) {
  //   user.posts = [...user.posts, ...updateUserDto.posts];
  // }

  // Guardar el usuario actualizado en la base de datos
  try {
    user = await this.userRepository.save(user);
  } catch (error) {
    throw new Error(`Error updating user: ${error.message}`);
  }
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async findProfileByUserId(id: string){
    const user = await this.userRepository.findOne({where: {
      id
    }, relations: ['profile']});
    return user.profile  
  }

  async updateProfileByUserId(id: string, updateProfileDto: UpdateProfileDto){
    const profile = await this.findProfileByUserId(id)
    return this.profileService.update(profile.id, updateProfileDto)  
  }

  async uploadProfilePhoto(id: string, file: Express.Multer.File){
    const profile = await this.findProfileByUserId(id)

    // Ruta donde guardar las fotos
    const uploadPath = `uploads`;
    // const uploadPath = `uploads/${id}`;

    // Verifica si el directorio de subida existe, si no, créalo
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    // Guarda la foto en el almacenamiento deseado
    const arr = file.originalname.split('.')
    const ext = arr[arr.length-1]
    const photoPath = `${uploadPath}/${profile.fullname}_${uuid()}.${ext}`; // Ruta donde guardas las fotos
    fs.writeFileSync(photoPath, file.buffer);

    const updateProfile: UpdateProfileDto = {profilePhoto: photoPath}
    return this.profileService.update(profile.id, updateProfile)  
  }

  async profilePhotoUrl(id: string){
    const profile = await this.findProfileByUserId(id)

    if(profile.profilePhoto.includes('googleusercontent'))
         return {photoUrl: profile.profilePhoto}
    
    //Verifica si el directorio de la foto existe, si no, lanza excepcion sino es de google
    if (!fs.existsSync(profile.profilePhoto)) {
      throw new NotFoundException("No existe la ruta de la foto");
    }
    
    //Genera la url
    const photoUrl = `http://localhost:3001/${profile.profilePhoto}`
    return {photoUrl}
  }

}
