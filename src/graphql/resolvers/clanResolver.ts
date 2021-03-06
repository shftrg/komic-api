import { ICreateAccountArgs } from './userResolver';
import { verifyUserToken, IVerfiyUser } from '../../utils/authenticateUser';
import { validateCreateClanInput } from '../../utils/inputValidator';
import { UserInputError, AuthenticationError } from 'apollo-server';
import UserModel from '../../models/UserModel';
import clanModel, { clanSlugModel } from '../../models/Clan';

export interface ICreateClanArgs {
  name: string;
  clanSlug: string;
}

export default {
  Mutation: {
    createClan: async (_, args: ICreateClanArgs, context) => {
      const decodedUser: IVerfiyUser = verifyUserToken(context);

      const errors = validateCreateClanInput(args);

      if (errors.length)
        throw new UserInputError('Invalid Arguments', { errors });

      const id = decodedUser.id;

      const { clanSlug, name } = args;

      const user = await UserModel.findById(id);

      let clanUrlSlug = await clanSlugModel.findOne({ url: clanSlug });

      if (clanUrlSlug) throw new UserInputError('URL is already taken');

      const clan = new clanModel();
      clan.name = name;

      clanUrlSlug = new clanSlugModel();
      clanUrlSlug.url = clanSlug;

      await clanUrlSlug.save();

      clan.clanSlug = clanUrlSlug._id;
      clan.owner = user._id;

      await clan.save();

      clan.clanSlug = clanUrlSlug;

      return clan;
    },
  },
  deleteClan: async (_, args: IClanDeleteArgs, context) => {
    const decodedUser = verifyUserToken(context);

    const { id } = args;

    const user = await UserModel.findById(decodedUser.id);

    const clan = await clanModel.findById(id);

    if (clan.owner.toString() !== user._id.toString())
      throw new AuthenticationError(
        'Cannot Delete Clan since user does not own it'
      );
  },
};

interface IClanDeleteArgs {
  id: string;
}
