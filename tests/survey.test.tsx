import React from 'react';
import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import SurveyAuth from '../components/SurveyAuth';
import Portal from '../components/SimpleSurveyPortal';
import Admin from '../components/SimpleSurveyAdmin';
import {blankSimpleSurvey} from '../lib/simple-survey';
const api=vi.hoisted(()=>({auth:{getSession:vi.fn(),onAuthStateChange:vi.fn(()=>({data:{subscription:{unsubscribe:vi.fn()}}})),signUp:vi.fn(),signInWithPassword:vi.fn(),signOut:vi.fn(),resetPasswordForEmail:vi.fn(),resend:vi.fn()},from:vi.fn(),rpc:vi.fn()}));
vi.mock('../lib/supabase',()=>({supabase:api,supabaseConfigured:true}));
vi.mock('../lib/simple-report',()=>({downloadSimpleSurveyPdf:vi.fn(),downloadDailySurveyPdf:vi.fn()}));
const user={id:'surveyor-one',email:'surveyor@example.invalid',user_metadata:{}};
const assignment={id:'assignment-one',surveyor_id:user.id,state_name:'Rajasthan',status:'assigned',created_at:'2026-09-09',updated_at:'2026-09-09'};
const query=(data:any)=>{const result:any={then:(resolve:any)=>Promise.resolve({data,error:null}).then(resolve)};for(const method of ['select','eq','order','limit','single','maybeSingle'])result[method]=()=>result;return result;};
beforeEach(()=>{vi.clearAllMocks();localStorage.clear();Object.defineProperty(navigator,'onLine',{value:true,configurable:true});api.auth.getSession.mockResolvedValue({data:{session:null}});api.from.mockImplementation((table:string)=>query(table==='simple_survey_assignments'?[assignment]:[]));});
afterEach(cleanup);

describe('Surveyor registration',()=>{
 it('normalizes email, preserves password and creates a named surveyor without requested privileges',async()=>{
  api.auth.signUp.mockResolvedValue({data:{session:null,user:{}},error:null});render(<SurveyAuth onReady={vi.fn()}/>);
  fireEvent.click(screen.getByText('New surveyor? Create an account'));
  fireEvent.change(screen.getByLabelText('Full name'),{target:{value:'Deepak Test'}});fireEvent.change(screen.getByLabelText('Email'),{target:{value:'DEEPAK@example.invalid'}});fireEvent.change(screen.getByLabelText('Password',{exact:true}),{target:{value:'TestPassword123'}});fireEvent.change(screen.getByLabelText('Confirm password'),{target:{value:'TestPassword123'}});fireEvent.click(screen.getByRole('button',{name:'Create Account'}));
  await waitFor(()=>expect(api.auth.signUp).toHaveBeenCalledOnce());expect(api.auth.signUp.mock.calls[0][0]).toMatchObject({email:'deepak@example.invalid',password:'TestPassword123',options:{data:{full_name:'Deepak Test'}}});expect(api.auth.signUp.mock.calls[0][0].options.data.role).toBeUndefined();await screen.findByText(/Check your email to confirm/);
 });
 it('blocks mismatched passwords before contacting the server',async()=>{
  render(<SurveyAuth onReady={vi.fn()}/>);fireEvent.click(screen.getByText('New surveyor? Create an account'));fireEvent.change(screen.getByLabelText('Full name'),{target:{value:'Test'}});fireEvent.change(screen.getByLabelText('Email'),{target:{value:'test@example.invalid'}});fireEvent.change(screen.getByLabelText('Password',{exact:true}),{target:{value:'TestPassword123'}});fireEvent.change(screen.getByLabelText('Confirm password'),{target:{value:'DifferentPassword'}});fireEvent.click(screen.getByRole('button',{name:'Create Account'}));await screen.findByText('Passwords do not match.');expect(api.auth.signUp).not.toHaveBeenCalled();
 });
});
describe('Survey saving',()=>{
 it('autosaves a real field edit with the expected server revision',async()=>{
  api.auth.getSession.mockResolvedValue({data:{session:{user}}});api.rpc.mockImplementation(async(_name,args)=>({data:{id:'form-one',...assignment,assignment_id:assignment.id,revision:1,status:'draft',form_data:args.p_form_data,updated_at:new Date().toISOString()},error:null}));render(<Portal/>);fireEvent.click(await screen.findByRole('button',{name:/Rajasthan/}));fireEvent.change(await screen.findByLabelText('Team Coordinator'),{target:{value:'Test coordinator'}});
  expect(JSON.parse(localStorage.getItem('ekatm-simple-survey:surveyor-one:assignment-one')!).data.meta.teamCoordinator).toBe('Test coordinator');await waitFor(()=>expect(api.rpc).toHaveBeenCalledWith('save_simple_survey',expect.objectContaining({p_expected_revision:0,p_submit:false,p_form_data:expect.objectContaining({meta:expect.objectContaining({teamCoordinator:'Test coordinator'})})})),{timeout:4000});await screen.findAllByText('Saved to central server');
 });
 it('preserves offline edits without claiming they reached the server',async()=>{
  Object.defineProperty(navigator,'onLine',{value:false,configurable:true});api.auth.getSession.mockResolvedValue({data:{session:{user}}});render(<Portal/>);fireEvent.click(await screen.findByRole('button',{name:/Rajasthan/}));fireEvent.change(await screen.findByLabelText('Team Coordinator'),{target:{value:'Offline coordinator'}});fireEvent.click(screen.getByRole('button',{name:'Save',exact:true}));expect(api.rpc).not.toHaveBeenCalled();await screen.findByText('Saved on device · will sync when connected');expect(JSON.parse(localStorage.getItem('ekatm-simple-survey:surveyor-one:assignment-one')!).dirty).toBe(true);
 });
 it('blocks an empty-role account from the admin interface',async()=>{
  api.auth.getSession.mockResolvedValue({data:{session:{user}}});render(<Admin/>);await screen.findByText('This account is not authorized for the Admin Control Panel.');expect(screen.queryByText('Assign a State to a Surveyor')).toBeNull();
 });
});
