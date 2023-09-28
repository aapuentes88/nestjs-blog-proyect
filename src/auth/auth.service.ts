import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { hashPassword, cmpPassword } from './utils/bcrypt';

@Injectable()
export class AuthService {

    constructor(private readonly userService: UsersService, private jwtService: JwtService) { }

    async validateUser(username: string, password: string) {
        console.log(`Inside validation AuthService`)
        const userDB = await this.userService.findUserByUserName(username)

        if (userDB) {
            const matched = cmpPassword(password, userDB.password)
            if (matched) {
                const { password, ...rest } = userDB
                // console.log(`User ${userDB} validation success`)
                return rest
            } else {
                //console.log(`Password do not match`)
                //return null
                throw new UnauthorizedException(`Password is wrong`)
            }

        }

        //console.log(`User  validation failed`)
        //return null
        throw new UnauthorizedException(`User is wrong`)

    }

    async register(register: RegisterDto) {
        const { username, password, email } = register
        const user = await this.userService.findOneByEmail(email)

        if (user) {
            throw new BadRequestException(`User ${username}  already exist`)
        }


        return await this.userService.create(
            {
                username,
                email,
                password: hashPassword(password)
            }
        )
    }

    async generateToken(user: any) {
        return {
            access_token: this.jwtService.sign({
                sub: user.id,
                username: user.username,
            })
        }
    }
}
