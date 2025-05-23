import { Test } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "./users.service";
import { User } from "./user.entity";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe('AuthService', () => {
    let service: AuthService;
    let fakeUsersService: Partial<UsersService>;
    beforeEach(async () => {
        //create fake copy of users service
        const users: User[]= [];
        fakeUsersService = {
            find: (email: string) => {
                const filteredUsers = users.filter(user => user.email === email);
                return Promise.resolve(filteredUsers);
            },
            create: (email:string,password:string) => {
                const user = {id: Math.floor(Math.random() * 99999), email, password} as User;
                users.push(user);
                return Promise.resolve(user);
            }
        }
        const module = await Test.createTestingModule({
            providers: [AuthService,
                {
                    provide: UsersService,
                    useValue: fakeUsersService
                }
            ]
        }).compile();

        service = module.get(AuthService);
    });

    it('can create an instance of auth service', async () => {
        expect(service).toBeDefined();
    });

    it('creates a new user with a salted and hashed password', async () => {
        const user = await service.signup('adasd@mail.com','asf');

        expect(user.password).not.toEqual('asf');
        const [salt, hash] = user.password.split('.');
        expect(salt).toBeDefined();
        expect(hash).toBeDefined();
    });

    it('throws an error if user signs up with email that is in use', async () => {
        await service.signup('asdf@asdf.com','asdf');
        await expect(service.signup('asdf@asdf.com','asdf')).rejects.toThrow(BadRequestException);
    });

    it('throws if sigin is called with an unused email', async () => {
        await expect(service.signin('asdfg@asdf.com','asdf')).rejects.toThrow(NotFoundException);
    });

    it('throws if an invalid password is provided', async () => {
        await service.signup('ladsalsd@askda.com', 'password1');
        await expect( service.signin('ladsalsd@askda.com', 'password')).rejects.toThrow(BadRequestException);
    });

    it('returns an user if correct password is provided', async () => {
        await service.signup('asdf@asdf.com','password');
        const user = await service.signin('asdf@asdf.com','password');
        expect(user).toBeDefined();

    });
})

